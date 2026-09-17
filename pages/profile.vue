<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

const banks = ref<any[]>([])
const ranking = ref<any>({ list: [], myRank: 0 })

onMounted(async () => {
  appStore.fetchAll()
  try {
    const [bankList, rank] = await Promise.all([
      $api<any[]>('/api/banks'),
      $api<any>('/api/ranking')
    ])
    banks.value = bankList
    ranking.value = rank
  } catch (e) {
    console.error('我的页面数据加载失败', e)
  }
})

const editing = ref(false)
const editName = ref('')
const saving = ref(false)

const maskedPhone = computed(() => {
  const p = appStore.user?.phone || ''
  return p.length === 11 ? p.slice(0, 3) + '****' + p.slice(7) : p
})

const unlockedCount = computed(() => appStore.achievements.filter(a => a.unlocked).length)
const hotBanks = computed(() => banks.value.slice(0, 2))

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜深了'
}

const checkingIn = ref(false)
const checkIn = async () => {
  if (appStore.checkedToday || checkingIn.value) return
  checkingIn.value = true
  try {
    const res = await $api<any>('/api/checkins', { method: 'POST' })
    appStore.checkedToday = true
    appStore.streak = res.streak
    if (appStore.user) appStore.user.streak = res.streak
    appStore.toastAchievements(res.newlyUnlocked || [])
    if (!res.alreadyChecked) $toast.success(`打卡成功！连续打卡 ${res.streak} 天`)
    ranking.value = await $api<any>('/api/ranking').catch(() => ranking.value)
  } catch (e: any) {
    $toast.error(e?.data?.message || '打卡失败')
  } finally {
    checkingIn.value = false
  }
}

const startEdit = () => {
  editName.value = appStore.user?.name || ''
  editing.value = true
}

const saveName = async () => {
  const name = editName.value.trim()
  if (!name) {
    $toast.warning('昵称不能为空')
    return
  }
  if (saving.value) return
  saving.value = true
  try {
    await $api('/api/users/me', { method: 'PUT', body: { name } })
    appStore.user.name = name
    appStore.user.avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name
    editing.value = false
    $toast.success('昵称已更新')
  } catch (e: any) {
    $toast.error(e?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="appStore.user" class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 用户信息（可编辑昵称 + 手机号脱敏） -->
    <div class="flex items-center gap-4 mb-6 fade-up mt-2">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1C2942] to-[#162032] p-0.5 shadow-lg relative">
        <img :src="appStore.user.avatar" class="w-full h-full rounded-[14px] bg-[#0B1120]" alt="avatar">
        <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-[#0B1120]"></div>
      </div>
      <div class="flex-1 min-w-0">
        <div v-if="!editing" class="flex items-center gap-2 mb-1">
          <h2 class="text-2xl font-bold tracking-tight truncate">{{ appStore.user.name }}</h2>
          <button class="text-xs text-teal-400 hover:text-teal-300 shrink-0" @click="startEdit">
            <i class="fas fa-pen"></i>
          </button>
        </div>
        <div v-else class="flex items-center gap-2 mb-1">
          <input v-model="editName" class="g-input h-9 text-sm max-w-[160px]" maxlength="20" @keyup.enter="saveName">
          <button class="g-btn g-btn-primary px-3 py-1.5 text-xs" :disabled="saving" @click="saveName">保存</button>
          <button class="text-xs text-[#64748B]" @click="editing = false">取消</button>
        </div>
        <p class="text-xs text-[#94A3B8] font-medium bg-[#162032] inline-block px-2 py-0.5 rounded-md border border-[#243049]">
          <i class="fas fa-mobile-screen text-teal-400 mr-1"></i> {{ maskedPhone }}
        </p>
      </div>
      <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors relative" @click="router.push('/notifications')">
        <i class="far fa-bell text-lg"></i>
        <div v-if="appStore.unreadCount > 0" class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      </div>
    </div>

    <!-- 数据概览面板（打卡 / 正确率 / 成就） -->
    <div class="g-card mb-8 p-5 relative overflow-hidden fade-up" style="animation-delay:0.05s">
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>
      <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>

      <div class="flex items-center justify-between mb-6 relative z-10">
        <div>
          <p class="text-[#94A3B8] text-sm mb-1 font-medium">累计答题</p>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">{{ appStore.user.totalAnswered }}</span>
            <span class="text-[#64748B] text-sm font-medium">道</span>
          </div>
        </div>
        <button
          class="g-btn g-btn-primary px-6 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(13,148,136,0.3)] text-sm"
          :class="appStore.checkedToday ? '!bg-[#1C2942] !text-[#64748B] !shadow-none cursor-default' : ''"
          :disabled="checkingIn"
          @click="checkIn"
        >
          <i class="fas" :class="appStore.checkedToday ? 'fa-check' : 'fa-calendar-check'"></i>
          {{ appStore.checkedToday ? '已打卡' : '今日打卡' }}
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 relative z-10">
        <div class="bg-[#0B1120]/50 p-4 rounded-2xl border border-[#243049]/50">
          <p class="text-[#64748B] text-xs font-medium mb-1.5 flex items-center gap-1.5"><i class="fas fa-bullseye text-pink-500"></i> 正确率</p>
          <p class="text-xl font-bold text-[#E8EDF5]">{{ appStore.accuracy }}%</p>
        </div>
        <div class="bg-[#0B1120]/50 p-4 rounded-2xl border border-[#243049]/50">
          <p class="text-[#64748B] text-xs font-medium mb-1.5 flex items-center gap-1.5"><i class="fas fa-trophy text-amber-500"></i> 成就</p>
          <p class="text-xl font-bold text-[#E8EDF5]">{{ unlockedCount }} <span class="text-xs text-[#64748B] font-normal">个</span></p>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="grid grid-cols-4 gap-3 mb-8 fade-up" style="animation-delay:0.1s">
      <div class="flex flex-col items-center gap-2 cursor-pointer group" @click="router.push('/bank')">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
          <i class="fas fa-layer-group text-2xl text-indigo-400"></i>
        </div>
        <span class="text-xs text-[#94A3B8] font-medium group-hover:text-[#E8EDF5] transition-colors">全部题库</span>
      </div>
      <div class="flex flex-col items-center gap-2 cursor-pointer group" @click="router.push('/wrong')">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center border border-red-500/20 group-hover:scale-105 transition-transform relative">
          <i class="fas fa-book-dead text-2xl text-red-400"></i>
          <span v-if="appStore.wrongBook.length > 0" class="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold px-1 border-2 border-[#0B1120]">{{ appStore.wrongBook.length }}</span>
        </div>
        <span class="text-xs text-[#94A3B8] font-medium group-hover:text-[#E8EDF5] transition-colors">错题本</span>
      </div>
      <div class="flex flex-col items-center gap-2 cursor-pointer group" @click="router.push('/favorites')">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
          <i class="fas fa-star text-2xl text-amber-400"></i>
        </div>
        <span class="text-xs text-[#94A3B8] font-medium group-hover:text-[#E8EDF5] transition-colors">收藏夹</span>
      </div>
      <div class="flex flex-col items-center gap-2 cursor-pointer group" @click="router.push('/stats')">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
          <i class="fas fa-chart-pie text-2xl text-emerald-400"></i>
        </div>
        <span class="text-xs text-[#94A3B8] font-medium group-hover:text-[#E8EDF5] transition-colors">数据分析</span>
      </div>
    </div>

    <!-- 功能列表 -->
    <div class="space-y-3 mb-8 fade-up" style="animation-delay:0.15s">
      <div class="g-card p-4 flex items-center justify-between cursor-pointer hover:border-[#14B8A6]/50 transition-colors group" @click="router.push('/history')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
            <i class="fas fa-history text-blue-400"></i>
          </div>
          <span class="font-bold">练习记录</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-[#94A3B8] group-hover:text-blue-400 transition-colors">{{ appStore.history.length }}</span>
          <i class="fas fa-chevron-right text-xs text-[#64748B]"></i>
        </div>
      </div>

      <div class="g-card p-4 flex items-center justify-between cursor-pointer hover:border-[#14B8A6]/50 transition-colors group" @click="router.push('/achievements')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
            <i class="fas fa-trophy text-purple-400"></i>
          </div>
          <span class="font-bold">成就中心</span>
        </div>
        <i class="fas fa-chevron-right text-xs text-[#64748B]"></i>
      </div>

      <div v-if="appStore.user.isAdmin" class="g-card p-4 flex items-center justify-between cursor-pointer hover:border-[#14B8A6]/50 transition-colors group" @click="router.push('/admin')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
            <i class="fas fa-toolbox text-rose-400"></i>
          </div>
          <span class="font-bold">题库管理</span>
        </div>
        <i class="fas fa-chevron-right text-xs text-[#64748B]"></i>
      </div>
    </div>

    <!-- 最近学习 -->
    <div class="fade-up mb-8" style="animation-delay:0.2s">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">最近学习</h3>
        <span class="text-sm text-[#64748B] hover:text-teal-400 cursor-pointer transition-colors" @click="router.push('/bank')">查看全部 <i class="fas fa-chevron-right text-[10px]"></i></span>
      </div>
      <div class="space-y-3">
        <BankCard v-for="bank in hotBanks" :key="bank.id" :bank="bank" :progress="appStore.bankProgress[bank.id] || 0" />
      </div>
    </div>

    <!-- 学习排行榜 -->
    <div class="fade-up mb-8" style="animation-delay:0.25s">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">学习排行榜</h3>
        <span v-if="ranking.myRank" class="text-sm text-[#94A3B8]">我的排名 <span class="text-teal-400 font-bold">#{{ ranking.myRank }}</span></span>
      </div>
      <div class="g-card p-2 space-y-1">
        <div v-if="ranking.list.length === 0" class="text-center py-6 text-sm text-[#64748B]">暂无排行数据</div>
        <div v-for="(r, i) in ranking.list.slice(0, 5)" :key="r.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
          :class="r.isMe ? 'bg-teal-500/10 border border-teal-500/30' : ''"
        >
          <span class="w-6 text-center text-sm font-black" :class="i === 0 ? 'text-amber-400' : i === 1 ? 'text-[#C0C0C0]' : i === 2 ? 'text-orange-400' : 'text-[#64748B]'">{{ i + 1 }}</span>
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C2942] to-[#162032] flex items-center justify-center text-xs font-bold text-[#94A3B8]">{{ r.name.slice(0, 1) }}</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate">{{ r.name }} <span v-if="r.isMe" class="text-teal-400 text-xs">(我)</span></p>
            <p class="text-[10px] text-[#64748B]">正确率 {{ r.accuracy }}% · 连续 {{ r.streak }} 天</p>
          </div>
          <span class="text-sm font-bold text-teal-400">{{ r.totalAnswered }} <span class="text-[10px] text-[#64748B] font-normal">题</span></span>
        </div>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="fade-up" style="animation-delay:0.3s">
      <button class="g-btn g-btn-ghost w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500" @click="appStore.handleLogout">
        <i class="fas fa-sign-out-alt"></i> 退出登录
      </button>
    </div>
  </div>
</template>
