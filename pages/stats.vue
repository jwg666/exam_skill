<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()

const accuracy = computed(() => {
  return appStore.totalAnswered ? Math.round(appStore.totalCorrect / appStore.totalAnswered * 100) : 0
})

const days = ['周一','周二','周三','周四','周五','周六','周日']
const weekData = [20, 45, 30, 80, 65, 10, 50] // mock data
const maxData = Math.max(...weekData)

const getBarHeight = (val: number) => {
  if (maxData === 0) return 0
  return (val / maxData) * 100
}
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 头部区域 -->
    <div class="flex items-center justify-between mb-6 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/profile')">
          <i class="fas fa-arrow-left"></i>
        </div>
        <h1 class="text-xl font-bold tracking-tight">数据分析</h1>
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="grid grid-cols-2 gap-4 mb-8 fade-up">
      <div class="g-card p-5 relative overflow-hidden bg-gradient-to-br from-[#1C2942] to-[#162032] border-[#243049]">
        <div class="absolute -right-4 -bottom-4 opacity-10">
          <i class="fas fa-bullseye text-6xl text-teal-400"></i>
        </div>
        <div class="text-xs font-medium text-[#94A3B8] mb-2 flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-teal-400"></div> 正确率</div>
        <p class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-300 to-blue-500">{{ accuracy }}<span class="text-sm text-[#64748B] font-bold">%</span></p>
      </div>
      <div class="g-card p-5 relative overflow-hidden bg-gradient-to-br from-[#1C2942] to-[#162032] border-[#243049]">
        <div class="absolute -right-4 -bottom-4 opacity-10">
          <i class="fas fa-fire text-6xl text-orange-400"></i>
        </div>
        <div class="text-xs font-medium text-[#94A3B8] mb-2 flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-orange-400"></div> 连续打卡</div>
        <p class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-500">{{ appStore.streak }}<span class="text-sm text-[#64748B] font-bold">天</span></p>
      </div>
    </div>

    <!-- 学习趋势图表 -->
    <div class="g-card p-6 mb-8 fade-up" style="animation-delay:0.1s">
      <h3 class="text-base font-bold mb-6 flex items-center gap-2">
        <i class="fas fa-chart-line text-[#14B8A6]"></i> 近7天学习趋势 (模拟)
      </h3>
      <div class="h-40 flex items-end justify-between gap-2 border-b border-[#243049] pb-2">
        <div v-for="(val, i) in weekData" :key="i" class="flex-1 flex flex-col items-center justify-end h-full group relative">
          <div class="absolute -top-8 bg-[#162032] text-xs font-bold px-2 py-1 rounded border border-[#243049] opacity-0 group-hover:opacity-100 transition-opacity z-10">{{ val }}题</div>
          <div class="w-full max-w-[24px] stat-bar bg-gradient-to-t from-teal-600/50 to-teal-400" :style="{ height: `${getBarHeight(val)}%` }"></div>
        </div>
      </div>
      <div class="flex justify-between mt-3 text-[10px] text-[#64748B] font-medium">
        <span v-for="d in days" :key="d">{{ d }}</span>
      </div>
    </div>

    <!-- 知识点掌握度 (雷达图概念) -->
    <div class="g-card p-6 fade-up" style="animation-delay:0.2s">
      <h3 class="text-base font-bold mb-6 flex items-center gap-2">
        <i class="fas fa-spider text-[#14B8A6]"></i> 掌握度分析
      </h3>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-xs font-bold mb-1">
            <span>前端基础</span>
            <span class="text-teal-400">85%</span>
          </div>
          <div class="progress-bar bg-[#0B1120]"><div class="progress-fill" style="width: 85%"></div></div>
        </div>
        <div>
          <div class="flex justify-between text-xs font-bold mb-1">
            <span>后端开发</span>
            <span class="text-blue-400">60%</span>
          </div>
          <div class="progress-bar bg-[#0B1120]"><div class="progress-fill bg-gradient-to-r from-blue-500 to-indigo-500" style="width: 60%"></div></div>
        </div>
        <div>
          <div class="flex justify-between text-xs font-bold mb-1">
            <span>算法与数据结构</span>
            <span class="text-orange-400">40%</span>
          </div>
          <div class="progress-bar bg-[#0B1120]"><div class="progress-fill bg-gradient-to-r from-orange-500 to-red-500" style="width: 40%"></div></div>
        </div>
      </div>
    </div>
  </div>
</template>