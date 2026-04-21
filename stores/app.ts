import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { achievementDefs } from '~/utils/data'
import { useNotificationStore } from '~/stores/notifications'

function formatYmd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYmd(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const useAppStore = defineStore('app', () => {
  const user = useStorage<any>('quizApp_user', null)
  const theme = useStorage<'dark' | 'light'>('quizApp_theme', 'dark')
  const totalAnswered = useStorage('quizApp_totalAnswered', 0)
  const totalCorrect = useStorage('quizApp_totalCorrect', 0)
  const streak = useStorage('quizApp_streak', 0)
  // 使用 YYYY-MM-DD 形式，便于计算连续打卡
  const checkedDays = useStorage<string[]>('quizApp_checkedDays', [])
  const wrongBook = useStorage<any[]>('quizApp_wrongBook', [])
  const favorites = useStorage<any[]>('quizApp_favorites', [])
  const history = useStorage<any[]>('quizApp_history', [])
  const bankProgress = useStorage<Record<string, number>>('quizApp_bankProgress', {})
  const achievements = useStorage<string[]>('quizApp_achievements', [])
  const currentBankCategory = useStorage('quizApp_currentBankCategory', 'all')

  const checkedInToday = computed(() => {
    const today = formatYmd(new Date())
    return checkedDays.value.includes(today)
  })

  // 同步用户数据到本地store
  function syncUserData(userData: any) {
    user.value = {
      id: userData.id,
      phone: userData.phone,
      name: userData.name,
      // 兼容页面里使用的 username 字段
      username: userData.name,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.name,
      loginTime: new Date().getTime()
    }
    totalAnswered.value = userData.totalAnswered || 0
    totalCorrect.value = userData.totalCorrect || 0
    streak.value = userData.streak || 0
  }

  function recomputeStreak() {
    if (checkedDays.value.length === 0) {
      streak.value = 0
      return
    }
    // 去重 + 排序
    const uniq = Array.from(new Set(checkedDays.value))
      .filter(Boolean)
      .sort((a, b) => parseYmd(a).getTime() - parseYmd(b).getTime())

    const today = parseYmd(formatYmd(new Date()))
    const checkedSet = new Set(uniq)

    // 只有今天打过卡才算正在连续
    if (!checkedSet.has(formatYmd(today))) {
      streak.value = 0
      checkedDays.value = uniq
      return
    }

    let s = 1
    for (let i = 1; i < 400; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (checkedSet.has(formatYmd(d))) s++
      else break
    }
    streak.value = s
    checkedDays.value = uniq
  }

  function checkIn() {
    if (checkedInToday.value) return false
    const today = formatYmd(new Date())
    checkedDays.value.push(today)
    recomputeStreak()
    return true
  }

  function checkAchievement(id: string) {
    if (!achievements.value.includes(id)) {
      achievements.value.push(id)
      const a = achievementDefs.find(x => x.id === id)
      if (a && process.client) {
        // 成就解锁写入一条通知（持久化）
        const notificationStore = useNotificationStore()
        notificationStore.add({
          type: 'achievement',
          title: `解锁成就：${a.name}`,
          content: a.desc || '你解锁了一个新的成就，继续保持！'
        })

        const { $toast } = useNuxtApp()
        if ($toast) {
          $toast.success(`🎉 解锁成就：${a.name}`)
        } else {
          alert(`🎉 解锁成就：${a.name}`)
        }
      }
    }
  }

  function handleLogout() {
    user.value = null
    localStorage.removeItem('quizApp_user')
    const { $toast } = useNuxtApp()
    if ($toast) $toast.info('已退出登录')
    const router = useRouter()
    setTimeout(() => {
      router.push('/login')
    }, 500)
  }

  function setTheme(next: 'dark' | 'light') {
    theme.value = next
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return {
    user,
    theme,
    totalAnswered,
    totalCorrect,
    streak,
    checkedDays,
    wrongBook,
    favorites,
    history,
    bankProgress,
    achievements,
    currentBankCategory,
    checkedInToday,
    syncUserData,
    recomputeStreak,
    checkIn,
    checkAchievement,
    handleLogout,
    setTheme,
    toggleTheme
  }
})