<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useQuizStore } from '~/stores/quiz'
import { getWrongQuestionsForBank, pickRandom } from '~/utils/quiz'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const quizStore = useQuizStore()

const bankId = route.params.id as string
const { data: bank } = await useFetch<any>(`/api/banks/${bankId}`)

if (!bank.value) {
  router.replace('/bank')
}

const progress = computed(() => appStore.bankProgress[bankId] || 0)
const percentage = computed(() => bank.value ? Math.round((progress.value / bank.value.total) * 100) : 0)
const wrongCount = computed(() => getWrongQuestionsForBank(appStore.wrongBook, bankId).length)

const startQuizRoute = (mode: 'practice'|'exam', startIndex = progress.value) => {
  if (!bank.value) return
  quizStore.startSession({
    bankId,
    questions: bank.value.questions,
    mode,
    startIndex,
    sessionType: mode === 'exam' ? 'bank_exam' : 'bank_practice',
    progressEnabled: mode === 'practice'
  })
  router.push('/quiz')
}

const startWrongRetry = () => {
  const qs = getWrongQuestionsForBank(appStore.wrongBook, bankId)
  if (qs.length === 0) return
  quizStore.startSession({
    bankId,
    questions: qs,
    mode: 'practice',
    startIndex: 0,
    sessionType: 'wrong_retry',
    progressEnabled: false
  })
  router.push('/quiz')
}

const startRandom10 = () => {
  if (!bank.value) return
  const qs = pickRandom(bank.value.questions || [], 10)
  quizStore.startSession({
    bankId,
    questions: qs,
    mode: 'practice',
    startIndex: 0,
    sessionType: 'bank_random10',
    progressEnabled: false
  })
  router.push('/quiz')
}

const isDone = (i: number) => i < progress.value
</script>

<template>
  <div v-if="bank" class="page min-h-screen bg-[#0B1120] text-[#E8EDF5] pb-24">
    <!-- 顶部封面 -->
    <div class="relative h-64 overflow-hidden rounded-b-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      <div class="absolute inset-0 opacity-20" :style="{ background: `linear-gradient(135deg, ${bank.color}, #0B1120)` }"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent z-10"></div>
      <div class="absolute top-12 left-5 z-20 w-10 h-10 rounded-full bg-[#162032]/80 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors" @click="router.back()">
        <i class="fas fa-arrow-left text-[#E8EDF5]"></i>
      </div>
      <div class="absolute bottom-8 left-6 right-6 z-20 flex items-end justify-between">
        <div>
          <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-4 shadow-xl">
            <i :class="[bank.icon, 'text-3xl']" :style="{ color: bank.color }"></i>
          </div>
          <h1 class="text-3xl font-black tracking-tight drop-shadow-md">{{ bank.name }}</h1>
        </div>
      </div>
    </div>

    <!-- 详细信息 -->
    <div class="px-5 -mt-2 relative z-30 fade-up">
      <div class="g-card p-6 shadow-xl border-t border-white/5">
        <p class="text-[#94A3B8] text-sm leading-relaxed mb-6">{{ bank.description }}</p>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-bold text-[#E8EDF5]">学习进度</span>
          <span class="text-sm font-bold text-[#14B8A6]">{{ percentage }}%</span>
        </div>
        <div class="progress-bar mb-4 bg-[#0B1120] shadow-inner">
          <div class="progress-fill shadow-[0_0_10px_rgba(13,148,136,0.5)]" :style="{ width: `${percentage}%` }"></div>
        </div>
        <div class="flex items-center justify-between text-xs font-medium text-[#64748B]">
          <span>已学习 {{ progress }} 题</span>
          <span>共 {{ bank.total }} 题</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-4 mt-6 fade-up" style="animation-delay:0.1s">
        <button class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)]" @click="startQuizRoute('practice')">
          <i class="fas fa-play text-sm"></i> 继续练习
        </button>
        <button class="g-btn g-btn-ghost flex-1 border-[#243049] bg-[#162032] hover:bg-[#1C2942] hover:text-white" @click="startQuizRoute('exam', 0)">
          <i class="fas fa-file-alt text-sm"></i> 模拟考试
        </button>
      </div>

      <div class="flex gap-4 mt-4 fade-up" style="animation-delay:0.15s">
        <button
          class="g-btn g-btn-ghost flex-1 border-[#243049] bg-[#162032] hover:bg-[#1C2942] hover:text-white"
          :disabled="wrongCount === 0"
          :class="{ 'opacity-50 cursor-not-allowed': wrongCount === 0 }"
          @click="startWrongRetry"
        >
          <i class="fas fa-redo text-sm"></i> 错题重练
          <span class="ml-1 text-xs text-[#94A3B8]">({{ wrongCount }})</span>
        </button>
        <button class="g-btn g-btn-ghost flex-1 border-[#243049] bg-[#162032] hover:bg-[#1C2942] hover:text-white" @click="startRandom10">
          <i class="fas fa-random text-sm"></i> 随机10题
        </button>
      </div>

      <!-- 题目列表 -->
      <div class="mt-8 fade-up" style="animation-delay:0.2s">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          <i class="fas fa-list-ul text-[#14B8A6]"></i> 题目列表
        </h3>
        <div class="space-y-3">
          <div v-for="(q, i) in bank.questions" :key="i" class="g-card p-3 flex items-center gap-3 cursor-pointer transition-all hover:border-[#0D9488]/50" :style="{ opacity: isDone(i) ? 0.7 : 1 }" @click="startQuizRoute('practice', i)">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors" :class="isDone(i) ? 'bg-[#0D9488] text-white' : 'bg-[#1C2942] text-[#64748B]'">
              {{ i + 1 }}
            </div>
            <span class="flex-1 text-sm truncate font-medium">{{ q.q }}</span>
            <i v-if="isDone(i)" class="fas fa-check-circle text-[#22C55E]"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="page min-h-screen bg-[#0B1120] text-[#E8EDF5] flex items-center justify-center pb-24">
    <div class="text-[#94A3B8]">加载中...</div>
  </div>
</template>