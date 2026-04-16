import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { achievementDefs } from '~/utils/data'

export const useAppStore = defineStore('app', () => {
  const user = useStorage<any>('quizApp_user', null)
  const totalAnswered = useStorage('quizApp_totalAnswered', 0)
  const totalCorrect = useStorage('quizApp_totalCorrect', 0)
  const streak = useStorage('quizApp_streak', 0)
  const checkedDays = useStorage<string[]>('quizApp_checkedDays', [])
  const wrongBook = useStorage<any[]>('quizApp_wrongBook', [])
  const favorites = useStorage<any[]>('quizApp_favorites', [])
  const history = useStorage<any[]>('quizApp_history', [])
  const bankProgress = useStorage<Record<string, number>>('quizApp_bankProgress', {})
  const achievements = useStorage<string[]>('quizApp_achievements', [])
  const currentBankCategory = useStorage('quizApp_currentBankCategory', 'all')

  const checkedInToday = computed(() => {
    const today = new Date().toDateString()
    return checkedDays.value.includes(today)
  })

  // 同步用户数据到本地store
  function syncUserData(userData: any) {
    user.value = {
      id: userData.id,
      phone: userData.phone,
      name: userData.name,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.name,
      loginTime: new Date().getTime()
    }
    totalAnswered.value = userData.totalAnswered || 0
    totalCorrect.value = userData.totalCorrect || 0
    streak.value = userData.streak || 0
  }

  function checkAchievement(id: string) {
    if (!achievements.value.includes(id)) {
      achievements.value.push(id)
      const a = achievementDefs.find(x => x.id === id)
      if (a && process.client) {
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

  return {
    user,
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
    checkAchievement,
    handleLogout
  }
})