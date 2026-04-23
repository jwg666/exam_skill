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
  const exp = useStorage('quizApp_exp', 0)
  const level = useStorage('quizApp_level', 1)
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
      loginTime: new Date().getTime(),
      exp: userData.exp ?? 0,
      level: userData.level ?? 1,
      nextExp: userData.nextExp ?? null,
    }
    totalAnswered.value = userData.totalAnswered || 0
    totalCorrect.value = userData.totalCorrect || 0
    streak.value = userData.streak || 0
    exp.value = Number(userData.exp || 0)
    level.value = Number(userData.level || 1)
    if (userData.theme === 'light' || userData.theme === 'dark') {
      theme.value = userData.theme
    }
  }

  async function hydrateFromServer() {
    if (!user.value?.id || !import.meta.client) return
    try {
      const res = await $fetch<any>('/api/me/state', { query: { userId: user.value.id } })
      if (!res?.ok) return
      syncUserData(res.user)
      achievements.value = res.achievements || []
      checkedDays.value = res.checkedDays || []
      recomputeStreak()
    } catch {
      // ignore：允许离线/未迁移数据库时继续 LocalStorage 体验
    }
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

  async function checkIn() {
    if (checkedInToday.value) return false
    if (user.value?.id && import.meta.client) {
      try {
        const res = await $fetch<any>('/api/me/checkin', { method: 'POST', query: { userId: user.value.id } })
        if (res?.ok && res.checkedDays) {
          checkedDays.value = res.checkedDays
          streak.value = Number(res.streak || 0)
          if (typeof res.exp === 'number') exp.value = res.exp
          if (typeof res.level === 'number') level.value = res.level
          if (user.value) {
            user.value.exp = exp.value
            user.value.level = level.value
          }
          return Boolean(res.checked)
        }
      } catch {
        // fallback local
      }
    }

    const today = formatYmd(new Date())
    checkedDays.value.push(today)
    recomputeStreak()
    return true
  }

  async function checkAchievement(id: string) {
    if (achievements.value.includes(id)) return

    const a = achievementDefs.find(x => x.id === id)

    if (user.value?.id && import.meta.client) {
      try {
        const res = await $fetch<any>('/api/me/achievements/unlock', {
          method: 'POST',
          query: { userId: user.value.id },
          body: { achievementId: id },
        })
        if (res?.ok && res.unlocked) {
          achievements.value.push(id)
          await useNotificationStore().refreshFromServer()
          const { $toast } = useNuxtApp()
          if (a && $toast) $toast.success(`🎉 解锁成就：${a.name}`)
        }
        return
      } catch {
        // fallback local
      }
    }

    achievements.value.push(id)
    if (a && process.client) {
      const notificationStore = useNotificationStore()
      notificationStore.add({
        type: 'achievement',
        title: `解锁成就：${a.name}`,
        content: a.desc || '你解锁了一个新的成就，继续保持！',
      })

      const { $toast } = useNuxtApp()
      if ($toast) {
        $toast.success(`🎉 解锁成就：${a.name}`)
      } else {
        alert(`🎉 解锁成就：${a.name}`)
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
    if (user.value?.id && import.meta.client) {
      $fetch('/api/me/theme', { method: 'POST', body: { userId: user.value.id, theme: next } }).catch(() => {})
    }
  }

  function toggleTheme() {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return {
    user,
    theme,
    exp,
    level,
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
    hydrateFromServer,
    recomputeStreak,
    checkIn,
    checkAchievement,
    handleLogout,
    setTheme,
    toggleTheme
  }
})