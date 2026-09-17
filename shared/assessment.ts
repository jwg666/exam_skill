// 测评报告：16 型人格（MBTI）与智商测试
// 题目 meta 约定：
//  MBTI: { dim: 'EI'|'SN'|'TF'|'JP', poles: [左选项字母, 右选项字母] }  两选项题
//  IQ:   { cat: '数列推理'|'数字运算'|'逻辑推理'|'语言文字'|'空间想象' }

export interface MbtiDim {
  dim: string
  left: string
  right: string
  leftPct: number
  rightPct: number
}

export interface MbtiTypeInfo {
  code: string
  name: string
  tagline: string
  traits: string[]
  strengths: string[]
  weaknesses: string[]
  careers: string[]
  compatible: string[]
}

export const MBTI_TYPES: Record<string, MbtiTypeInfo> = {
  INTJ: { code: 'INTJ', name: '建筑师', tagline: '独立而深邃的战略思考者，永远在构建更优的系统', traits: ['战略眼光', '独立思考', '高标准', '目标导向'], strengths: ['擅长长线规划与系统设计', '理性决策，不被情绪裹挟', '求知欲强，钻研到底'], weaknesses: ['对他人要求过高，显得苛刻', '不擅表达情感，容易显得疏离', '过度自信于自己的判断'], careers: ['战略咨询', '架构师/科研', '投资分析', '产品负责人'], compatible: ['ENFP', 'ENTP'] },
  INTP: { code: 'INTP', name: '逻辑学家', tagline: '沉迷于理解世界底层规律的智识探险家', traits: ['好奇求知', '逻辑严密', '思想开放', '低调独立'], strengths: ['极强的抽象与分析能力', '敢于质疑既有结论', '思路灵活，善于创新'], weaknesses: ['行动力偏弱，想法多落地少', '对琐碎事务缺乏耐心', '社交中容易心不在焉'], careers: ['算法/研究', '哲学与理论科学', '数据分析', '技术专家'], compatible: ['ENTJ', 'ENFJ'] },
  ENTJ: { code: 'ENTJ', name: '指挥官', tagline: '天生领导者，把宏大目标拆解成可执行的路线图', traits: ['果断坚毅', '全局视野', '高效执行', '自信强势'], strengths: ['卓越的战略与组织能力', '敢于拍板并承担责任', '驱动团队达成高目标'], weaknesses: ['过于强势，容易压制他人', '耐心不足，嫌步骤繁琐', '工作与生活失衡倾向'], careers: ['企业管理', '创业', '投行/战略', '项目总负责'], compatible: ['INTP', 'INFP'] },
  ENTP: { code: 'ENTP', name: '辩论家', tagline: '点子层出不穷的挑战者，享受思想交锋的火花', traits: ['机智敏捷', '喜欢挑战', '善于辩论', '拥抱变化'], strengths: ['创意源源不断', '快速学习与举一反三', '敢于打破常规'], weaknesses: ['三分钟热度，难以坚持收尾', '为辩而辩容易得罪人', '厌恶重复性工作'], careers: ['创新业务', '市场策划', '咨询顾问', '创业者'], compatible: ['INFJ', 'INTJ'] },
  INFJ: { code: 'INFJ', name: '提倡者', tagline: '理想主义的引路人，温和外表下有坚定的信念', traits: ['洞察人心', '理想主义', '坚定执着', '温和深邃'], strengths: ['深刻的共情与洞察力', '为长期价值默默坚持', '善于启发和成全他人'], weaknesses: ['过度付出容易耗竭', '对冲突极度回避', '完美主义带来内耗'], careers: ['心理咨询', '教育/公益', '内容创作', '人力资源'], compatible: ['ENTP', 'ENTJ'] },
  INFP: { code: 'INFP', name: '调停者', tagline: '内心住着诗与远方的理想家，为认同的价值而活', traits: ['理想主义', '共情力强', '忠诚于价值', '安静温柔'], strengths: ['极强的同理心与善意', '创造力与文字表达力佳', '对认定的事极度忠诚'], weaknesses: ['回避冲突，委屈自己', '对现实事务拖延', '情绪敏感易受挫'], careers: ['写作/艺术', '心理与社工', '设计', '公益组织'], compatible: ['ENFJ', 'ENTJ'] },
  ENFJ: { code: 'ENFJ', name: '主人公', tagline: '天生的引导者，热衷于看见每个人变好', traits: ['热忱慷慨', '感染力强', '善于组织', '体贴入微'], strengths: ['凝聚人心与激励团队', '敏锐感知他人需求', '责任感与行动力兼备'], weaknesses: ['过度在意他人评价', '不善于拒绝，容易透支', '理想化他人导致失望'], careers: ['教育培训', '团队管理', '公关运营', '教练/导师'], compatible: ['INFP', 'ISFP'] },
  ENFP: { code: 'ENFP', name: '竞选者', tagline: '热情四射的可能性收藏家，把生活过成冒险', traits: ['热情洋溢', '好奇心强', '真诚自由', '灵感不断'], strengths: ['极强的感染力与人缘', '跨界联想与创造力', '拥抱变化勇于尝试'], weaknesses: ['专注力易分散', '讨厌条条框框的约束', '情绪起伏较明显'], careers: ['创意策划', '主持/传播', '品牌营销', '自由职业'], compatible: ['INFJ', 'INTJ'] },
  ISTJ: { code: 'ISTJ', name: '物流师', tagline: '可靠到可以托付一切的秩序守护者', traits: ['严谨务实', '责任感强', '尊重规则', '沉稳可靠'], strengths: ['说到做到极可信赖', '细致耐心零差错', '在稳定体系中持续产出'], weaknesses: ['对新事物接受偏慢', '不灵活，有时显得固执', '不擅长表达情感'], careers: ['财务审计', '行政管理', '工程师', '公务员'], compatible: ['ESFP', 'ESTP'] },
  ISFJ: { code: 'ISFJ', name: '守卫者', tagline: '默默守护身边人的温暖后盾', traits: ['温柔体贴', '任劳任怨', '记忆出众', '低调谦逊'], strengths: ['细致周到的关怀力', '极强的责任心与耐心', '踏实稳定值得托付'], weaknesses: ['不善拒绝导致过劳', '把委屈藏在心里', '抗拒变化与冲突'], careers: ['医护/护理', '教师/行政', '客户服务', '图书馆/档案'], compatible: ['ESTP', 'ESFP'] },
  ESTJ: { code: 'ESTJ', name: '总经理', tagline: '强执行的管理者，秩序和效率的代言人', traits: ['果断务实', '组织力强', '直来直去', '重视承诺'], strengths: ['卓越的执行与推动力', '清晰的流程与标准意识', '在混乱中快速建立秩序'], weaknesses: ['语气生硬不够共情', '过度依赖经验与规则', '控制欲较强'], careers: ['运营管理', '生产/供应链', '法务合规', '军队/警务'], compatible: ['ISFP', 'ISTP'] },
  ESFJ: { code: 'ESFJ', name: '执政官', tagline: '天生的凝聚者，把所有人都照顾得妥妥帖帖', traits: ['热心肠', '重视和谐', '尽职尽责', '人缘极佳'], strengths: ['极强的亲和与协调力', '记得每个人的需要', '务实把关怀落到行动'], weaknesses: ['太在意别人的看法', '回避必要的冲突', '付出期待回报易失落'], careers: ['客户关系', '行政人事', '社区服务', '活动组织'], compatible: ['ISFP', 'ISTP'] },
  ISTP: { code: 'ISTP', name: '鉴赏家', tagline: '冷静的动手派，用双手拆解并征服世界', traits: ['冷静务实', '动手能力强', '随性自由', '危机中镇定'], strengths: ['卓越的动手与排障能力', '临危不乱心理素质佳', '工具与机械的天生直觉'], weaknesses: ['不喜欢长期承诺', '话少让人难以走近', '追求刺激可能冒险'], careers: ['工程师/技师', '飞行员/驾驶', '运动员', '安全专家'], compatible: ['ESFJ', 'ESTJ'] },
  ISFP: { code: 'ISFP', name: '探险家', tagline: '活在当下的艺术家，用审美温柔地感受世界', traits: ['温和敏感', '审美出众', '活在当下', '不爱争辩'], strengths: ['艺术感觉与创造力佳', '真诚不做作', '极强的适应与包容'], weaknesses: ['长期规划能力偏弱', '回避冲突与表达不满', '容易被安排和消耗'], careers: ['设计/艺术', '美食/手作', '康养理疗', '摄影旅行'], compatible: ['ENFJ', 'ESFJ'] },
  ESTP: { code: 'ESTP', name: '企业家', tagline: '行动派的冒险家，哪里有机遇哪里就有他', traits: ['精力充沛', '敢想敢干', '机敏善辩', '享受当下'], strengths: ['极快的反应与决断力', '强抗压，越乱越兴奋', '天生的谈判与行动天赋'], weaknesses: ['冲动决策缺乏铺垫', '对枯燥细节零耐心', '容易忽视他人感受'], careers: ['销售/商务', '创业', '应急消防', '体育电竞'], compatible: ['ISFJ', 'ISTJ'] },
  ESFP: { code: 'ESFP', name: '表演者', tagline: '自带聚光灯的快乐源泉，把每个当下变成派对', traits: ['热情开朗', '享受当下', '表现力强', '慷慨大方'], strengths: ['超强的感染与娱乐天赋', '让氛围轻松愉快', '务实灵活乐于助人'], weaknesses: ['回避严肃与长远规划', '容易被情绪带着走', '对批评较为敏感'], careers: ['主播/演艺', '活动策划', '旅游体验', '零售导购'], compatible: ['ISTJ', 'ISFJ'] }
}

const DIM_NAMES: Record<string, string> = {
  EI: '外向 E ↔ 内向 I（能量来源）',
  SN: '实感 S ↔ 直觉 N（信息获取）',
  TF: '思考 T ↔ 情感 F（决策方式）',
  JP: '判断 J ↔ 知觉 P（生活态度）'
}

// 生成 MBTI 报告。answers 为每题所选项索引数组（-1 表示未答）
export function buildMbtiReport(questions: any[], answers: number[]): any {
  const tally: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  const dims: MbtiDim[] = []

  for (const dim of ['EI', 'SN', 'TF', 'JP']) {
    let left = 0
    let right = 0
    questions.forEach((q, i) => {
      const meta = safeJson(q.meta)
      if (!meta || meta.dim !== dim) return
      const a = answers[i]
      if (a === 0) left++
      else if (a === 1) right++
    })
    const poles = polesOf(questions, dim)
    const total = left + right
    const leftPct = total ? Math.round((left / total) * 100) : 50
    dims.push({ dim, left: poles[0], right: poles[1], leftPct, rightPct: 100 - leftPct })
    tally[poles[0]] += left
    tally[poles[1]] += right
  }

  const typeCode = (tally.E > tally.I ? 'E' : 'I') + (tally.S > tally.N ? 'S' : 'N') + (tally.T > tally.F ? 'T' : 'F') + (tally.J > tally.P ? 'J' : 'P')
  const info = MBTI_TYPES[typeCode] || MBTI_TYPES.INTJ

  return {
    kind: 'mbti',
    typeCode,
    typeName: info.name,
    tagline: info.tagline,
    dims: dims.map((d) => ({ ...d, label: DIM_NAMES[d.dim] })),
    traits: info.traits,
    strengths: info.strengths,
    weaknesses: info.weaknesses,
    careers: info.careers,
    compatible: info.compatible,
    note: '人格类型没有好坏之分，结果反映的是你的自然偏好而非能力上限。建议结合近期状态多次测试对照参考。'
  }
}

function polesOf(questions: any[], dim: string): [string, string] {
  for (const q of questions) {
    const meta = safeJson(q.meta)
    if (meta && meta.dim === dim && Array.isArray(meta.poles)) return [meta.poles[0], meta.poles[1]]
  }
  return [dim[0], dim[1]]
}

function safeJson(s: any): any {
  try { return s ? JSON.parse(s) : null } catch { return null }
}

// 生成 IQ 报告。correct 为服务端判分结果
export function buildIqReport(questions: any[], answers: number[], correct: number, total: number): any {
  const accuracy = total ? correct / total : 0
  // 换算：0% → 60，100% → 145，近似正态分布的线性映射
  const iq = Math.round(60 + accuracy * 85)
  const tiers: Array<[number, string, string, string]> = [
    [135, '极有天赋', '#A78BFA', '你的推理能力极为出众，远超绝大多数人。保持挑战高难度问题的习惯，可尝试竞赛级题目或研究型课题。'],
    [120, '优秀', '#34D399', '你的逻辑思维非常扎实，学习新知识往往比别人更快。复杂问题拆解与多角度思考是你的优势。'],
    [110, '中上', '#60A5FA', '你的思维能力良好，多数推理问题都能从容应对。适当练习数列与逻辑题可以再上一个台阶。'],
    [90, '中等', '#FBBF24', '你的推理能力处于正常范围，日常问题处理没有压力。坚持刻意练习会看到明显提升。'],
    [70, '待提升', '#FB923C', '这次的发挥可能不够理想，或题目类型不熟悉。放慢节奏、善用排除法，多练几组再试试。'],
    [0, '待提升', '#FB923C', '这次可能没进入状态。别灰心，智商测试波动很大，休息好之后再来一次。']
  ]
  const tier = tiers.find((t) => iq >= t[0]) || tiers[tiers.length - 1]

  // 分类维度分析
  const catMap = new Map<string, { cat: string; total: number; correct: number }>()
  questions.forEach((q, i) => {
    const meta = safeJson(q.meta)
    const cat = meta?.cat || '综合'
    const entry = catMap.get(cat) || { cat, total: 0, correct: 0 }
    entry.total++
    const a = answers[i]
    const right = Array.isArray(q.ans) ? false : a === q.answer_index
    if (right) entry.correct++
    catMap.set(cat, entry)
  })
  const byCat = [...catMap.values()].map((e) => ({ ...e, pct: Math.round((e.correct / e.total) * 100) }))

  const best = [...byCat].sort((a, b) => b.pct - a.pct)[0]
  const worst = [...byCat].sort((a, b) => a.pct - b.pct)[0]

  return {
    kind: 'iq',
    iq,
    tier: tier[1],
    tierColor: tier[2],
    advice: tier[3],
    percentile: estimatePercentile(iq),
    byCat,
    bestCat: best ? best.cat : '',
    worstCat: worst ? worst.cat : ''
  }
}

// 常态分布（均值100 标准差15）下的近似人群百分比
function estimatePercentile(iq: number): string {
  const pct = Math.round(cdf((iq - 100) / 15) * 1000) / 10
  return `估算超过约 ${pct}% 的同龄人`
}

function cdf(z: number): number {
  // logistic 近似正态 CDF
  return 1 / (1 + Math.exp(-1.702 * z))
}
