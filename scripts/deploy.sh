#!/usr/bin/env bash
# 一键部署脚本：构建 → 打包 → 上传 → 服务器补依赖 → 重启服务
# 用法: bash scripts/deploy.sh <SERVER> <SSH_KEY> [DEPLOY_DIR] [APP_PORT]
# 例:   bash scripts/deploy.sh root@<服务器IP> ~/.ssh/<密钥> /home/exam 3000
# 凭据不入库：数据库/短信等配置存于服务器上 $DEPLOY_DIR/.env（权限 600），
# 首次部署时若无则上传本地 .env 初始化，之后的部署不会覆盖服务器上的配置。
set -e

SERVER="${1:?用法: deploy.sh <SERVER> <SSH_KEY> [DEPLOY_DIR] [APP_PORT]}"
SSH_KEY="${2:?缺少 SSH_KEY 参数}"
DEPLOY_DIR="${3:-/home/exam}"
APP_PORT="${4:-3000}"

echo "[1/6] 本地构建..."
pnpm build

echo "[2/6] 生成服务器端补依赖清单（pnpm 布局下 Nitro 会漏追踪传递依赖）..."
node - <<'EOF'
const fs = require('fs');
const path = require('path');
const outNM = path.resolve('.output/server/node_modules');
const missing = new Set();
function check(pkgDir) {
  let pkg; try { pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')); } catch { return; }
  for (const dep of Object.keys(pkg.dependencies || {})) {
    try { require.resolve(dep, { paths: [path.dirname(pkgDir)] }); } catch { missing.add(dep); }
  }
}
for (const dir of fs.readdirSync(outNM)) {
  const d = path.join(outNM, dir);
  if (!fs.statSync(d).isDirectory()) continue;
  if (dir.startsWith('@')) { for (const sub of fs.readdirSync(d)) check(path.join(d, sub)); }
  else check(d);
}
console.log('缺失依赖:', [...missing].join(', ') || '无');
// 从 .pnpm store 提取精确版本：目录名 <name#@+>@<version>_<peerHash>，版本在第一个 _ 之前
const deps = {};
if (missing.size) {
  const all = fs.readdirSync(path.resolve('node_modules/.pnpm'));
  for (const dep of missing) {
    const prefix = dep.replace('/', '+') + '@';
    const versions = all
      .filter(d => d.startsWith(prefix))
      .map(d => d.slice(prefix.length).split('_')[0]);
    versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    deps[dep] = '^' + versions[versions.length - 1];
  }
}
fs.writeFileSync('.server-package.json', JSON.stringify({ name: 'exam-app-runtime', private: true, dependencies: deps }, null, 2));
EOF

echo "[3/6] 上传构建产物与环境配置..."
scp -o BatchMode=yes -i "$SSH_KEY" .server-package.json "$SERVER:$DEPLOY_DIR/package.json"
tar czf - .output | ssh -o BatchMode=yes -i "$SSH_KEY" "$SERVER" "mkdir -p $DEPLOY_DIR && tar xzf - -C $DEPLOY_DIR"
# .env 只在服务器上不存在时才初始化上传；已存在则保留服务器配置（密钥以服务器为准）
ssh -o BatchMode=yes -i "$SSH_KEY" "$SERVER" "if [ ! -f $DEPLOY_DIR/.env ]; then echo NEED_ENV; fi" | grep -q NEED_ENV && {
  scp -o BatchMode=yes -i "$SSH_KEY" .env "$SERVER:$DEPLOY_DIR/.env"
  echo "  已上传初始 .env"
} || echo "  服务器已有 .env，保留不覆盖"
ssh -o BatchMode=yes -i "$SSH_KEY" "$SERVER" "chmod 600 $DEPLOY_DIR/.env"

echo "[4/6] 服务器安装补依赖..."
ssh -o BatchMode=yes -i "$SSH_KEY" "$SERVER" "cd $DEPLOY_DIR && npm install --omit=dev --no-audit --no-fund"

echo "[5/6] 重启服务..."
ssh -o BatchMode=yes -i "$SSH_KEY" "$SERVER" "systemctl restart exam-app && sleep 2 && systemctl is-active exam-app"

echo "[6/6] 健康检查..."
code=$(ssh -o BatchMode=yes -i "$SSH_KEY" "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/")
[ "$code" = "200" ] || { echo "健康检查失败: HTTP $code"; exit 1; }

rm -f .server-package.json
echo "部署完成: http://$(echo "$SERVER" | cut -d@ -f2):$APP_PORT"
