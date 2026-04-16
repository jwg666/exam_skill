<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { achievementDefs } from '~/utils/data'

const appStore = useAppStore()
const router = useRouter()
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 头部区域 -->
    <div class="flex items-center justify-between mb-6 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/profile')">
          <i class="fas fa-arrow-left"></i>
        </div>
        <h1 class="text-xl font-bold tracking-tight">成就中心</h1>
      </div>
      <div class="text-sm font-medium text-[#94A3B8]">
        已解锁 <span class="text-amber-400 font-bold">{{ appStore.achievements.length }}</span>/{{ achievementDefs.length }}
      </div>
    </div>

    <!-- 进度条 -->
    <div class="g-card p-4 mb-6 bg-gradient-to-r from-[#1C2942] to-[#162032] border-[#243049] flex items-center gap-4 fade-up">
      <div class="w-12 h-12 rounded-full bg-[#0B1120] flex items-center justify-center border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
        <i class="fas fa-trophy text-amber-400 text-xl"></i>
      </div>
      <div class="flex-1">
        <div class="flex justify-between text-xs font-bold mb-2">
          <span class="text-[#E8EDF5]">收集进度</span>
          <span class="text-amber-400">{{ Math.round((appStore.achievements.length / achievementDefs.length) * 100) }}%</span>
        </div>
        <div class="progress-bar bg-[#0B1120]">
          <div class="progress-fill bg-gradient-to-r from-amber-500 to-yellow-300" :style="{ width: `${(appStore.achievements.length / achievementDefs.length) * 100}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 成就列表 -->
    <div class="grid grid-cols-2 gap-3">
      <div 
        v-for="(a, i) in achievementDefs" :key="a.id" 
        class="g-card p-4 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 fade-up"
        :class="appStore.achievements.includes(a.id) ? 'border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-[#162032]' : 'opacity-60 grayscale filter'"
        :style="{ animationDelay: `${i * 0.05}s` }"
      >
        <div v-if="appStore.achievements.includes(a.id)" class="absolute -right-6 -top-6 w-16 h-16 bg-amber-400/20 rounded-full blur-xl"></div>
        
        <div class="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center text-2xl shadow-inner border border-white/5"
          :class="appStore.achievements.includes(a.id) ? '' : 'bg-[#1C2942]'"
          :style="{ background: appStore.achievements.includes(a.id) ? a.color : '', color: appStore.achievements.includes(a.id) ? '#fff' : '#64748B' }"
        >
          <i :class="a.icon"></i>
        </div>
        
        <h3 class="text-sm font-bold mb-1" :class="appStore.achievements.includes(a.id) ? 'text-[#E8EDF5]' : 'text-[#94A3B8]'">{{ a.name }}</h3>
        <p class="text-[10px] text-[#64748B] leading-tight px-1">{{ a.desc }}</p>
        
        <div v-if="appStore.achievements.includes(a.id)" class="absolute top-2 right-2 text-amber-400">
          <i class="fas fa-check-circle text-sm drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]"></i>
        </div>
      </div>
    </div>
  </div>
</template>