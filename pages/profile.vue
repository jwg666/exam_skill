<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
</script>

<template>
  <div v-if="appStore.user" class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 用户信息 -->
    <div class="flex items-center gap-4 mb-8 fade-up mt-2">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1C2942] to-[#162032] p-0.5 shadow-lg relative">
        <img :src="appStore.user.avatar" class="w-full h-full rounded-[14px] bg-[#0B1120]" alt="avatar">
        <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-[#0B1120]"></div>
      </div>
      <div class="flex-1">
        <h2 class="text-2xl font-bold tracking-tight mb-1">{{ appStore.user.username }}</h2>
        <p class="text-xs text-[#94A3B8] font-medium bg-[#162032] inline-block px-2 py-0.5 rounded-md border border-[#243049]">
          <i class="fas fa-id-badge text-teal-400 mr-1"></i> 极客学员
        </p>
      </div>
      <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/notifications')">
        <i class="far fa-bell text-lg"></i>
      </div>
    </div>

    <!-- 核心数据 -->
    <div class="g-card mb-6 p-0 overflow-hidden fade-up" style="animation-delay:0.1s">
      <div class="grid grid-cols-3 divide-x divide-[#243049]">
        <div class="p-4 text-center cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/stats')">
          <p class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-teal-400 to-blue-500">{{ appStore.totalAnswered }}</p>
          <p class="text-xs text-[#94A3B8] font-medium mt-1">累计答题</p>
        </div>
        <div class="p-4 text-center cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/stats')">
          <p class="text-2xl font-bold text-[#E8EDF5]">{{ appStore.totalAnswered ? Math.round(appStore.totalCorrect / appStore.totalAnswered * 100) : 0 }}<span class="text-sm text-[#64748B]">%</span></p>
          <p class="text-xs text-[#94A3B8] font-medium mt-1">正确率</p>
        </div>
        <div class="p-4 text-center cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/achievements')">
          <p class="text-2xl font-bold text-amber-400">{{ appStore.achievements.length }}</p>
          <p class="text-xs text-[#94A3B8] font-medium mt-1">获得成就</p>
        </div>
      </div>
    </div>

    <!-- 快捷入口列表 -->
    <div class="space-y-3 mb-8 fade-up" style="animation-delay:0.2s">
      <div class="g-card p-4 flex items-center justify-between cursor-pointer hover:border-[#14B8A6]/50 transition-colors group" @click="router.push('/favorites')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
            <i class="fas fa-star text-amber-400"></i>
          </div>
          <span class="font-bold">我的收藏</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-[#94A3B8] group-hover:text-amber-400 transition-colors">{{ appStore.favorites.length }}</span>
          <i class="fas fa-chevron-right text-xs text-[#64748B]"></i>
        </div>
      </div>
      
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
    </div>

    <!-- 退出登录 -->
    <div class="fade-up" style="animation-delay:0.3s">
      <button class="g-btn g-btn-ghost w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500" @click="appStore.handleLogout">
        <i class="fas fa-sign-out-alt"></i> 退出登录
      </button>
    </div>
  </div>
</template>