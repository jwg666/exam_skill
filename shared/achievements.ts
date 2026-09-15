// 成就定义：前后端共用（服务端判定解锁并落库，前端只负责展示与 Toast）
export interface AchievementDef {
  id: string
  name: string
  desc: string
  icon: string
  color: string
}

export const achievementDefs: AchievementDef[] = [
  { id: 'first_login', name: '初来乍到', desc: '首次登录', icon: 'fas fa-door-open', color: '#4ADE80' },
  { id: 'first_quiz', name: '小试牛刀', desc: '完成第一次答题', icon: 'fas fa-pen', color: '#60A5FA' },
  { id: 'quiz_50', name: '学海初航', desc: '累计答题50题', icon: 'fas fa-ship', color: '#2DD4BF' },
  { id: 'quiz_200', name: '题海遨游', desc: '累计答题200题', icon: 'fas fa-water', color: '#818CF8' },
  { id: 'quiz_500', name: '学富五车', desc: '累计答题500题', icon: 'fas fa-graduation-cap', color: '#FBBF24' },
  { id: 'streak_3', name: '三日之约', desc: '连续打卡3天', icon: 'fas fa-fire', color: '#FB923C' },
  { id: 'streak_7', name: '周周不落', desc: '连续打卡7天', icon: 'fas fa-fire-flame-curved', color: '#EF4444' },
  { id: 'streak_30', name: '月度冠军', desc: '连续打卡30天', icon: 'fas fa-crown', color: '#F59E0B' },
  { id: 'acc_80', name: '准确射手', desc: '单次答题正确率80%以上', icon: 'fas fa-bullseye', color: '#EC4899' },
  { id: 'acc_100', name: '完美无瑕', desc: '单次答题正确率100%', icon: 'fas fa-gem', color: '#A78BFA' },
  { id: 'fav_10', name: '收藏达人', desc: '收藏10道题目', icon: 'fas fa-bookmark', color: '#F472B6' },
  { id: 'wrong_clear', name: '知错能改', desc: '清空错题本', icon: 'fas fa-check-double', color: '#34D399' }
]

export function findAchievement(id: string): AchievementDef | undefined {
  return achievementDefs.find((a) => a.id === id)
}
