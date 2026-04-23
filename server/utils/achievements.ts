import type mysql from 'mysql2/promise'

const ACH_TITLES: Record<string, { title: string; content: string }> = {
  first_login: { title: '解锁成就：初来乍到', content: '首次登录' },
  first_quiz: { title: '解锁成就：小试牛刀', content: '完成第一次答题' },
  quiz_50: { title: '解锁成就：学海初航', content: '累计答题50题' },
  quiz_200: { title: '解锁成就：题海遨游', content: '累计答题200题' },
  quiz_500: { title: '解锁成就：学富五车', content: '累计答题500题' },
  streak_3: { title: '解锁成就：三日之约', content: '连续打卡3天' },
  streak_7: { title: '解锁成就：周周不落', content: '连续打卡7天' },
  streak_30: { title: '解锁成就：月度冠军', content: '连续打卡30天' },
  acc_80: { title: '解锁成就：准确射手', content: '单次答题正确率80%以上' },
  acc_100: { title: '解锁成就：完美无瑕', content: '单次答题正确率100%' },
  fav_10: { title: '解锁成就：收藏达人', content: '收藏10道题目' },
  wrong_clear: { title: '解锁成就：知错能改', content: '清空错题本' },
}

export async function tryUnlockAchievement(conn: mysql.PoolConnection, userId: number, achievementId: string) {
  const [r] = await conn.execute<any>(
    `INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)`,
    [userId, achievementId]
  )
  const inserted = Number(r?.affectedRows || 0) > 0
  if (!inserted) return false

  const meta = ACH_TITLES[achievementId] || { title: `解锁成就：${achievementId}`, content: '你解锁了一个新的成就，继续保持！' }
  await conn.execute(
    `INSERT INTO notifications (user_id, type, title, content) VALUES (?, 'achievement', ?, ?)`,
    [userId, meta.title, meta.content]
  )
  return true
}

export async function unlockMilestoneQuizAchievements(conn: mysql.PoolConnection, userId: number, prevTotalAnswered: number, nextTotalAnswered: number) {
  const unlocked: string[] = []
  const tryRange = async (id: string, at: number) => {
    if (prevTotalAnswered < at && nextTotalAnswered >= at) {
      const ok = await tryUnlockAchievement(conn, userId, id)
      if (ok) unlocked.push(id)
    }
  }

  await tryRange('first_quiz', 1)
  await tryRange('quiz_50', 50)
  await tryRange('quiz_200', 200)
  await tryRange('quiz_500', 500)
  return unlocked
}

export async function unlockAccuracyAchievements(conn: mysql.PoolConnection, userId: number, accuracy: number) {
  const unlocked: string[] = []
  const acc = Number(accuracy)
  if (acc >= 80 && acc < 100) {
    if (await tryUnlockAchievement(conn, userId, 'acc_80')) unlocked.push('acc_80')
  }
  if (acc === 100) {
    if (await tryUnlockAchievement(conn, userId, 'acc_80')) unlocked.push('acc_80')
    if (await tryUnlockAchievement(conn, userId, 'acc_100')) unlocked.push('acc_100')
  }
  return unlocked
}

export async function unlockStreakAchievements(conn: mysql.PoolConnection, userId: number, streak: number) {
  const unlocked: string[] = []
  const s = Number(streak)
  if (s >= 3) {
    if (await tryUnlockAchievement(conn, userId, 'streak_3')) unlocked.push('streak_3')
  }
  if (s >= 7) {
    if (await tryUnlockAchievement(conn, userId, 'streak_7')) unlocked.push('streak_7')
  }
  if (s >= 30) {
    if (await tryUnlockAchievement(conn, userId, 'streak_30')) unlocked.push('streak_30')
  }
  return unlocked
}
