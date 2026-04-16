<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { questionBanks } from '~/utils/data'

const appStore = useAppStore()
const router = useRouter()

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

const checkIn = () => {
  if (appStore.checkedInToday) return
  
  const today = new Date().toDateString()
  appStore.checkedDays.push(today)
  appStore.streak += 1
  appStore.checkedInToday = true
  
  const { $toast } = useNuxtApp()
  $toast.success(`打卡成功！连续打卡 ${appStore.streak} 天`)
  
  if (appStore.streak >= 3) appStore.checkAchievement('streak_3')
  if (appStore.streak >= 7) appStore.checkAchievement('streak_7')
  if (appStore.streak >= 30) appStore.checkAchievement('streak_30')
}

const recentBanks = computed(() => {
  // Return first 2 banks for demonstration or use real history
  return questionBanks.slice(0, 2)
})
</script>

<template>
  <div v-if="appStore.user" class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 头部问候 -->
    <div class="flex items-center justify-between mb-8 fade-up">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1C2942] to-[#162032] p-0.5 shadow-lg relative cursor-pointer hover:scale-105 transition-transform" @click="router.push('/profile')">
          <img :src="appStore.user.avatar" class="w-full h-full rounded-[14px] bg-[#0B1120]" alt="avatar">
          <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0B1120]"></div>
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight">{{ getGreeting() }}，{{ appStore.user.username }}</h2>
          <p class="text-xs text-[#94A3B8] mt-1 flex items-center gap-1.5">
            <i class="fas fa-fire text-orange-500"></i> 已连续学习 {{ appStore.streak }} 天
          </p>
        </div>
      </div>
      <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors relative" @click="router.push('/notifications')">
        <i class="far fa-bell text-lg"></i>
        <div class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      </div>
    </div>

    <!-- 数据概览面板 -->
    <div class="g-card mb-8 p-5 relative overflow-hidden fade-up" style="animation-delay:0.1s">
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl"></div>
      <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
      
      <div class="flex items-center justify-between mb-6 relative z-10">
        <div>
          <p class="text-[#94A3B8] text-sm mb-1 font-medium">累计答题</p>
          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">{{ appStore.totalAnswered }}</span>
            <span class="text-[#64748B] text-sm font-medium">道</span>
          </div>
        </div>
        <button 
          class="g-btn g-btn-primary px-6 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(13,148,136,0.3)] text-sm"
          :class="appStore.checkedInToday ? '!bg-[#1C2942] !text-[#64748B] !shadow-none cursor-default' : ''"
          @click="checkIn"
        >
          <i class="fas" :class="appStore.checkedInToday ? 'fa-check' : 'fa-calendar-check'"></i> 
          {{ appStore.checkedInToday ? '已打卡' : '今日打卡' }}
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4 relative z-10">
        <div class="bg-[#0B1120]/50 p-4 rounded-2xl border border-[#243049]/50">
          <p class="text-[#64748B] text-xs font-medium mb-1.5 flex items-center gap-1.5"><i class="fas fa-bullseye text-pink-500"></i> 正确率</p>
          <p class="text-xl font-bold text-[#E8EDF5]">
            {{ appStore.totalAnswered ? Math.round(appStore.totalCorrect / appStore.totalAnswered * 100) : 0 }}%
          </p>
        </div>
        <div class="bg-[#0B1120]/50 p-4 rounded-2xl border border-[#243049]/50">
          <p class="text-[#64748B] text-xs font-medium mb-1.5 flex items-center gap-1.5"><i class="fas fa-trophy text-amber-500"></i> 成就</p>
          <p class="text-xl font-bold text-[#E8EDF5]">{{ appStore.achievements.length }} <span class="text-xs text-[#64748B] font-normal">个</span></p>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="grid grid-cols-4 gap-3 mb-8 fade-up" style="animation-delay:0.2s">
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

    <!-- 最近学习 -->
    <div class="fade-up" style="animation-delay:0.3s">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">最近学习</h3>
        <span class="text-sm text-[#64748B] hover:text-teal-400 cursor-pointer transition-colors" @click="router.push('/bank')">查看全部 <i class="fas fa-chevron-right text-[10px]"></i></span>
      </div>
      <div class="space-y-3">
        <BankCard v-for="bank in recentBanks" :key="bank.id" :bank="bank" />
      </div>
    </div>
  </div>
</template>