<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()

const formatDate = (timestamp: number) => {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
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
        <h1 class="text-xl font-bold tracking-tight">练习记录</h1>
      </div>
      <span class="text-sm font-medium text-[#94A3B8]">共 <span class="text-[#14B8A6] font-bold">{{ appStore.history.length }}</span> 次</span>
    </div>

    <!-- 记录列表 -->
    <div class="space-y-4">
      <div v-if="appStore.history.length === 0" class="text-center py-20 fade-up">
        <div class="w-24 h-24 rounded-full bg-[#162032] flex items-center justify-center mx-auto mb-4 border border-[#243049]/50 shadow-inner">
          <i class="fas fa-history text-4xl text-[#64748B]"></i>
        </div>
        <p class="text-[#94A3B8] font-medium">暂无练习记录</p>
        <button class="g-btn g-btn-primary mt-6 px-6 py-2" @click="router.push('/bank')">
          去刷题 <i class="fas fa-arrow-right text-xs ml-1"></i>
        </button>
      </div>

      <TransitionGroup name="list">
        <div v-for="(h, i) in appStore.history" :key="h.time" class="g-card p-5 relative overflow-hidden group fade-up" :style="{ animationDelay: `${i * 0.05}s` }">
          <div class="absolute top-0 left-0 w-1 h-full" :class="h.score >= 60 ? 'bg-gradient-to-b from-teal-400 to-teal-600' : 'bg-gradient-to-b from-red-400 to-orange-500'"></div>
          
          <div class="flex items-start justify-between mb-3 pl-2">
            <div>
              <h3 class="text-base font-bold flex items-center gap-2 mb-1">
                {{ h.bankName }}
                <span class="g-tag text-[10px] py-0.5 px-1.5" :class="h.mode === 'exam' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'">
                  {{ h.mode === 'exam' ? '考试' : '练习' }}
                </span>
              </h3>
              <p class="text-xs text-[#64748B] font-medium">{{ formatDate(h.time) }}</p>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black" :class="h.score >= 60 ? 'text-teal-400' : 'text-red-400'">{{ h.score }}</span>
              <span class="text-xs font-bold text-[#64748B]">分</span>
            </div>
          </div>
          
          <div class="pl-2 pt-3 border-t border-[#243049] flex items-center justify-between text-xs font-medium">
            <span class="flex items-center gap-1.5 text-[#94A3B8]">
              <i class="far fa-clock text-blue-400"></i> 用时 {{ formatTime(h.elapsed) }}
            </span>
            <div class="flex gap-3">
              <span class="text-green-400"><i class="fas fa-check"></i> {{ h.correct }}</span>
              <span class="text-red-400"><i class="fas fa-times"></i> {{ h.wrong }}</span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>