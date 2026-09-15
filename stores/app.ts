import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

// 服务端返回的成就定义（含解锁状态）
export interface AchievementItem {
  id: string
  name: string
  desc: string
  icon: string
  color: string
  unlocked: boolean
  unlockedAt: string | null
}

export const useAppStore = defineStore('app', () => {
  // 仅 token 与用户基础信息持久化；业务数据全部来自服务端
  const token = useStorage<string>('quizApp_token', '')
  const user = useStorage<any>('quizApp_user', null)

  // 会话内业务数据（登录后拉取）
  const wrongBook = ref<any[]>([])
  const favorites = ref<any[]>([])
  const history = ref<any[]>([])
  const achievements = ref<AchievementItem[]>([])
  const bankProgress = ref<Record<string, number>>({})
  const checkedToday = ref(false)
  const streak = ref(0)
  const unreadCount = ref(0)

  const accuracy = computed(() =>
    user.value?.totalAnswered ? Math.round((user.value.totalCorrect / user.value.totalAnswered) * 100) : 0
  )

  function toastAchievements(list: any[]) {
    if (!list?.length || !import.meta.client) return
    const { $toast } = useNuxtApp()
    for (const def of list) $toast.success(`🎉 解锁成就：${def.name}`)
  }

  // 登录/注册成功后调用
  function setSession(data: { token: string; user: any }) {
    token.value = data.token
    user.value = {
      id: data.user.id,
      phone: data.user.phone,
      name: data.user.name,
      totalAnswered: data.user.totalAnswered || 0,
      totalCorrect: data.user.totalCorrect || 0,
      streak: data.user.streak || 0,
      isAdmin: !!data.user.isAdmin,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.user.name,
      loginTime: Date.now()
    }
    streak.value = user.value.streak
  }

  function resetData() {
    wrongBook.value = []
    favorites.value = []
    history.value = []
    achievements.value = []
    bankProgress.value = {}
    checkedToday.value = false
    streak.value = 0
    unreadCount.value = 0
  }

  // 登录后并行拉取全量用户数据
  async function fetchAll() {
    if (!token.value) return
    const { $api } = useNuxtApp()
    try {
      const [checkin, achievementsRes, wrong, favs, historyRes, progress] = await Promise.all([
        $api('/api/checkins'),
        $api('/api/achievements'),
        $api('/api/wrong-book'),
        $api('/api/favorites'),
        $api('/api/histories'),
        $api('/api/progress')
      ])
      checkedToday.value = checkin.checkedToday
      streak.value = checkin.streak
      achievements.value = achievementsRes
      wrongBook.value = wrong
      favorites.value = favs
      history.value = historyRes
      bankProgress.value = progress
      try {
        const nf = await $api('/api/notifications')
        unreadCount.value = nf.unread
      } catch { /* 通知失败不阻塞 */ }
    } catch (err) {
      console.error('拉取用户数据失败', err)
    }
  }

  async function handleLogout() {
    resetData()
    token.value = ''
    user.value = null
    if (import.meta.client) {
      const { $toast } = useNuxtApp()
      $toast.info('已退出登录')
      useRouter().push('/login')
    }
  }

  return {
    token,
    user,
    wrongBook,
    favorites,
    history,
    achievements,
    bankProgress,
    checkedToday,
    streak,
    unreadCount,
    accuracy,
    setSession,
    fetchAll,
    resetData,
    toastAchievements,
    handleLogout
  }
})
