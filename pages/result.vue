<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useQuizStore } from '~/stores/quiz'
import { questionBanks } from '~/utils/data'

definePageMeta({ layout: false })

const appStore = useAppStore()
const quizStore = useQuizStore()
const router = useRouter()

if (!quizStore.bankId || quizStore.questions.length === 0) {
  router.replace('/')
}

const bank = questionBanks.find(b => b.id === quizStore.bankId)

const total = quizStore.questions.length
let correct = 0
let wrong = 0
let unans = 0

quizStore.questions.forEach((q, i) => {
  if (quizStore.answers[i] === undefined) {
    unans++
  } else if (quizStore.answers[i] === q.ans) {
    correct++
  } else {
    wrong++
  }
})

const score = Math.round((correct / total) * 100) || 0

// Record history
onMounted(() => {
  appStore.history.unshift({
    bankId: quizStore.bankId,
    bankName: bank?.name || '未知',
    mode: quizStore.mode,
    score,
    time: Date.now(),
    elapsed: quizStore.elapsed,
    total,
    correct,
    wrong
  })
})

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}
</script>

<template>
  <div class="page flex flex-col min-h-screen bg-[#0B1120] text-[#E8EDF5]">
    <div class="relative py-12 px-5 text-center z-10 overflow-hidden flex-1 flex flex-col justify-center">
      <div class="absolute inset-0 bg-gradient-to-b from-teal-900/40 via-[#0B1120] to-[#0B1120] z-0"></div>
      
      <!-- 动态圆环背景 -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border border-teal-500/20 z-0 animate-spin-slow"></div>
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full border border-blue-500/10 z-0 animate-spin-slow" style="animation-direction: reverse;"></div>

      <div class="relative z-10 fade-up">
        <h2 class="text-2xl font-black mb-2 tracking-tight drop-shadow-md">答题完成</h2>
        <p class="text-[#94A3B8] font-medium mb-10">{{ bank?.name || '综合练习' }} · {{ quizStore.mode === 'exam' ? '模拟考试' : '自由练习' }}</p>

        <div class="ring-progress w-48 h-48 mx-auto mb-10 relative">
          <svg class="w-full h-full drop-shadow-[0_0_20px_rgba(20,184,166,0.5)]" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#162032" stroke-width="8" />
            <circle 
              cx="60" cy="60" r="54" fill="none" 
              stroke="url(#grad)" stroke-width="8" 
              stroke-linecap="round"
              :stroke-dasharray="339.292" 
              :stroke-dashoffset="339.292 * (1 - score/100)"
              class="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0D9488" />
                <stop offset="100%" stop-color="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
          <div class="ring-text absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-300 to-blue-500 drop-shadow-sm">{{ score }}</span>
            <span class="text-sm font-bold text-[#64748B] mt-1 tracking-widest">分</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-10">
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5 hover:-translate-y-1 transition-transform">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="fas fa-check text-green-400"></i> 正确</p>
            <p class="text-2xl font-bold text-green-400">{{ correct }}</p>
          </div>
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5 hover:-translate-y-1 transition-transform" style="transition-delay: 50ms">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="fas fa-times text-red-400"></i> 错误</p>
            <p class="text-2xl font-bold text-red-400">{{ wrong }}</p>
          </div>
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5 hover:-translate-y-1 transition-transform" style="transition-delay: 100ms">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="far fa-clock text-blue-400"></i> 用时</p>
            <p class="text-lg font-bold text-blue-400 mt-1">{{ formatTime(quizStore.elapsed) }}</p>
          </div>
        </div>
      </div>

      <div class="flex gap-4 relative z-10 fade-up px-5" style="animation-delay: 0.2s">
        <button class="g-btn g-btn-ghost flex-1 bg-[#162032] border-[#243049] hover:bg-[#1C2942] hover:text-white" @click="router.replace(`/bank/${quizStore.bankId}`)">
          返回题库
        </button>
        <button class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)]" @click="router.replace('/wrong')">
          查看错题 <i class="fas fa-arrow-right text-sm ml-1"></i>
        </button>
      </div>
    </div>
  </div>
</template>