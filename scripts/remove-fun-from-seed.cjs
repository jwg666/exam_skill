// 一次性工具：从 seed_data.js 移除 fun 库定义（fun 已由 scripts/seed-fun-quiz.js 独立管理）
const { readFileSync, writeFileSync } = require('node:fs');
const src = readFileSync('seed_data.js', 'utf8');
const start = src.indexOf("        id: 'fun'");
if (start === -1) { console.log('seed_data.js 中无 fun 库，跳过'); process.exit(0); }
// fun 块起点是它前面的逗号换行；终点是数组闭合 "\n];" 前
const arrEnd = src.indexOf('\n];', start);
const before = src.slice(0, start).replace(/,\s*\n$/, '\n');
const out = before + src.slice(arrEnd);
writeFileSync('seed_data.js', out);
console.log('fun 块已移除，剩余库数:', (out.match(/id: '/g) || []).length);
