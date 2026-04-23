<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useQuizStore } from '~/stores/quiz'
import { removeWrongByIds } from '~/utils/quiz'

definePageMeta({ layout: false })

const appStore = useAppStore()
const quizStore = useQuizStore()
const router = useRouter()
const { $toast } = useNuxtApp()

if (!quizStore.bankId || quizStore.questions.length === 0) {
  router.replace('/bank')
}

const q = computed(() => quizStore.questions[quizStore.currentIdx])
const isFav = computed(() => appStore.favorites.some(f => f.q === q.value?.q))
const isFlagged = computed(() => quizStore.flags[quizStore.currentIdx] || false)

const timerInterval = ref<any>(null)
const currentTime = ref(0)

onMounted(() => {
  timerInterval.value = setInterval(() => {
    currentTime.value = Math.floor((Date.now() - quizStore.startTime) / 1000)
  }, 1000)
})
onUnmounted(() => {
  clearInterval(timerInterval.value)
})

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const toggleFav = () => {
  if (!q.value) return
  if (isFav.value) {
    appStore.favorites = appStore.favorites.filter(f => f.q !== q.value.q)
    $toast.info('已取消收藏')
  } else {
    appStore.favorites.push({ ...q.value, bankId: quizStore.bankId, time: Date.now() })
    $toast.success('收藏成功')
    if (appStore.favorites.length >= 10) void appStore.checkAchievement('fav_10')
  }
}

const toggleFlag = () => {
  quizStore.flags[quizStore.currentIdx] = !quizStore.flags[quizStore.currentIdx]
}

const selectOption = (idx: number) => {
  if (quizStore.answered && quizStore.mode === 'practice') return
  quizStore.selectedOption = idx
}

const submitAnswer = () => {
  if (quizStore.selectedOption === -1) {
    $toast.warning('请先选择一个选项')
    return
  }

  quizStore.answers[quizStore.currentIdx] = quizStore.selectedOption

  const isCorrect = quizStore.selectedOption === q.value.ans
  if (isCorrect) {
    if (quizStore.mode === 'practice') {
      if (quizStore.progressEnabled) {
        const p = appStore.bankProgress[quizStore.bankId!] || 0
        if (quizStore.currentIdx >= p) {
          appStore.bankProgress[quizStore.bankId!] = quizStore.currentIdx + 1
        }
      }
    }
  } else {
    const existing = appStore.wrongBook.find(w => w.q === q.value.q)
    if (existing) {
      existing.errCount = (existing.errCount || 1) + 1
      existing.time = Date.now()
    } else {
      appStore.wrongBook.push({
        ...q.value,
        bankId: quizStore.bankId,
        time: Date.now(),
        errCount: 1
      })
    }
  }

  quizStore.answered = true
  if (quizStore.mode === 'exam') {
    nextQuestion()
  }
}

const nextQuestion = () => {
  if (quizStore.currentIdx < quizStore.questions.length - 1) {
    quizStore.currentIdx++
    quizStore.selectedOption = quizStore.answers[quizStore.currentIdx] !== undefined ? quizStore.answers[quizStore.currentIdx] : -1
    quizStore.answered = quizStore.answers[quizStore.currentIdx] !== undefined
  } else {
    finishQuiz()
  }
}

const prevQuestion = () => {
  if (quizStore.currentIdx > 0) {
    quizStore.currentIdx--
    quizStore.selectedOption = quizStore.answers[quizStore.currentIdx] !== undefined ? quizStore.answers[quizStore.currentIdx] : -1
    quizStore.answered = quizStore.answers[quizStore.currentIdx] !== undefined
  }
}

const finishQuiz = async () => {
  quizStore.elapsed = Math.floor((Date.now() - quizStore.startTime) / 1000)

  const total = quizStore.questions.length
  let correct = 0
  const wrongQuestions = []
  const masteredWrongIds: Array<string | number> = []
  
  for (let i = 0; i < total; i++) {
    if (quizStore.answers[i] === quizStore.questions[i].ans) {
      correct++
      if (quizStore.sessionType === 'wrong_retry') {
        const id = quizStore.questions[i]?.id
        if (id !== undefined && id !== null) masteredWrongIds.push(id)
      }
    } else {
      wrongQuestions.push(quizStore.questions[i].id)
    }
  }
  
  const accuracy = Math.round((correct / total) * 100)

  const ymd = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  try {
    const res = await $fetch<any>('/api/quiz/submit', {
      method: 'POST',
      body: {
        userId: appStore.user?.id,
        bankId: quizStore.bankId,
        total,
        correct,
        timeSpent: quizStore.elapsed,
        accuracy,
        wrongQuestions,
        dateStr: ymd(),
      },
    })
    if (res?.user) {
      appStore.syncUserData(res.user)
    }
    if (Array.isArray(res?.unlockedAchievements) && res.unlockedAchievements.length) {
      for (const id of res.unlockedAchievements) {
        // 服务器已落库；同步本地集合，避免重复弹窗
        if (!appStore.achievements.includes(id)) appStore.achievements.push(id)
      }
    }
  } catch(e) {
    console.error('Submit to server failed', e)
  }

  if (quizStore.sessionType === 'wrong_retry' && masteredWrongIds.length > 0) {
    const before = appStore.wrongBook.length
    appStore.wrongBook = removeWrongByIds(appStore.wrongBook, masteredWrongIds)
    const removed = Math.max(0, before - appStore.wrongBook.length)
    if (removed > 0) $toast.success(`已掌握并移除 ${removed} 题`)
    if (appStore.wrongBook.length === 0) {
      void appStore.checkAchievement('wrong_clear')
    }
  }

  if (appStore.history) {
    appStore.history.push({
      bankId: quizStore.bankId,
      date: new Date().toLocaleDateString(),
      total,
      correct,
      time: quizStore.elapsed,
      accuracy
    })
  }

  router.push('/result')
}

const showSheet = ref(false)
const jumpTo = (i: number) => {
  quizStore.currentIdx = i
  quizStore.selectedOption = quizStore.answers[i] !== undefined ? quizStore.answers[i] : -1
  quizStore.answered = quizStore.answers[i] !== undefined
  showSheet.value = false
}
</script>

<template>
  <div v-if="q" class="page bg-[#0B1120] text-[#E8EDF5] min-h-screen flex flex-col relative overflow-hidden">
    <!-- 背景动画效果 -->
    <div class="absolute inset-0 pointer-events-none opacity-20">
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/20 to-transparent rounded-full blur-3xl mix-blend-screen"></div>
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl mix-blend-screen"></div>
    </div>

    <!-- 顶部导航 -->
    <div class="page-header px-5 py-4 flex items-center justify-between bg-opacity-95 shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.back()">
          <i class="fas fa-times"></i>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[#94A3B8] font-medium tracking-wide uppercase">{{ quizStore.mode === 'exam' ? '模拟考试' : '自由练习' }}</span>
          <span class="text-base font-bold">{{ quizStore.currentIdx + 1 }} <span class="text-[#64748B] text-sm">/ {{ quizStore.questions.length }}</span></span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm font-mono bg-[#162032] px-3 py-1.5 rounded-lg border border-[#243049] text-teal-400">
          <i class="far fa-clock"></i> <span id="timer">{{ formatTime(currentTime) }}</span>
        </div>
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center cursor-pointer hover:bg-[#1C2942] transition-colors" @click="showSheet = true">
          <i class="fas fa-th-large text-[#94A3B8]"></i>
        </div>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-bar rounded-none h-1 bg-[#162032]">
      <div class="progress-fill rounded-none" :style="{ width: `${((quizStore.currentIdx + 1) / quizStore.questions.length) * 100}%` }"></div>
    </div>

    <!-- 题目内容 -->
    <div class="flex-1 overflow-y-auto px-5 py-6 pb-32 z-10 relative">
      <div class="mb-8 fade-up">
        <div class="flex items-start gap-3 mb-4">
          <span class="g-tag bg-gradient-to-r from-teal-500 to-teal-400 text-white shadow-[0_2px_10px_rgba(13,148,136,0.3)] text-xs py-1 px-2.5">单选</span>
          <h2 class="text-lg font-bold leading-relaxed text-justify">{{ q.q }}</h2>
        </div>
      </div>

      <div class="space-y-3 fade-up" style="animation-delay:0.1s">
        <div 
          v-for="(opt, i) in q.opts" :key="i"
          class="quiz-option group"
          :class="{
            'selected': quizStore.selectedOption === i && (!quizStore.answered || quizStore.mode === 'exam'),
            'correct': quizStore.answered && quizStore.mode === 'practice' && i === q.ans,
            'wrong': quizStore.answered && quizStore.mode === 'practice' && quizStore.selectedOption === i && i !== q.ans
          }"
          @click="selectOption(i)"
        >
          <div class="opt-label group-hover:bg-[#243049] transition-colors shadow-sm">{{ String.fromCharCode(65 + i) }}</div>
          <span class="flex-1 text-[15px] font-medium leading-relaxed">{{ opt }}</span>
          <i v-if="quizStore.answered && quizStore.mode === 'practice' && i === q.ans" class="fas fa-check-circle text-white text-lg"></i>
          <i v-if="quizStore.answered && quizStore.mode === 'practice' && quizStore.selectedOption === i && i !== q.ans" class="fas fa-times-circle text-white text-lg"></i>
        </div>
      </div>

      <!-- 解析 -->
      <div v-if="quizStore.answered && quizStore.mode === 'practice'" class="mt-8 p-5 bg-gradient-to-br from-[#1C2942] to-[#162032] border border-[#243049] rounded-2xl fade-up relative overflow-hidden shadow-lg">
        <div class="absolute top-0 left-0 w-1 h-full" :class="quizStore.selectedOption === q.ans ? 'bg-green-500' : 'bg-red-500'"></div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold flex items-center gap-2">
            <i class="fas fa-lightbulb text-amber-400"></i> 答案解析
          </h3>
          <span class="text-sm font-bold" :class="quizStore.selectedOption === q.ans ? 'text-green-500' : 'text-red-500'">
            {{ quizStore.selectedOption === q.ans ? '回答正确' : '回答错误' }}
          </span>
        </div>
        <p class="text-sm text-[#94A3B8] leading-relaxed text-justify">
          正确答案：<span class="text-white font-bold">{{ String.fromCharCode(65 + q.ans) }}</span>。{{ q.exp }}
        </p>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-[#0B1120]/90 backdrop-blur-xl border-t border-[#243049] flex items-center gap-3 z-20 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      <div class="flex gap-2">
        <button class="w-12 h-12 rounded-xl bg-[#162032] flex items-center justify-center text-[#94A3B8] hover:bg-[#1C2942] hover:text-white transition-colors border border-[#243049]" @click="toggleFav">
          <i class="fas fa-star" :class="isFav ? 'text-amber-400' : ''"></i>
        </button>
        <button class="w-12 h-12 rounded-xl bg-[#162032] flex items-center justify-center text-[#94A3B8] hover:bg-[#1C2942] hover:text-white transition-colors border border-[#243049]" @click="toggleFlag">
          <i class="fas fa-flag" :class="isFlagged ? 'text-orange-400' : ''"></i>
        </button>
      </div>
      
      <button v-if="!quizStore.answered" class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)] text-[15px] font-bold" @click="submitAnswer">
        提交答案 <i class="fas fa-paper-plane text-sm ml-1"></i>
      </button>
      <div v-else class="flex flex-1 gap-2">
        <button class="g-btn g-btn-ghost flex-1 bg-[#162032] hover:bg-[#1C2942] hover:text-white border-[#243049]" @click="prevQuestion" :disabled="quizStore.currentIdx === 0" :class="{ 'opacity-50 cursor-not-allowed': quizStore.currentIdx === 0 }">
          <i class="fas fa-arrow-left text-sm mr-1"></i> 上一题
        </button>
        <button class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)]" @click="nextQuestion">
          {{ quizStore.currentIdx === quizStore.questions.length - 1 ? '完成' : '下一题' }} <i class="fas" :class="quizStore.currentIdx === quizStore.questions.length - 1 ? 'fa-check' : 'fa-arrow-right'"></i>
        </button>
      </div>
    </div>

    <!-- 答题卡抽屉 -->
    <div v-if="showSheet" class="modal-overlay z-50" @click.self="showSheet = false">
      <div class="modal-content pb-[calc(2rem+env(safe-area-inset-bottom))] relative shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div class="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#243049] rounded-full"></div>
        <div class="flex items-center justify-between mb-6 mt-4">
          <h3 class="text-lg font-bold">答题卡</h3>
          <div class="flex gap-4 text-xs font-medium">
            <span class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-teal-500/20 border border-teal-500"></div>当前</span>
            <span class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-[#162032] border border-[#243049]"></div>未答</span>
            <span class="flex items-center gap-1"><div class="w-3 h-3 rounded-sm bg-orange-500/20 border border-orange-500"></div>标记</span>
          </div>
        </div>
        <div class="grid grid-cols-6 gap-3">
          <div 
            v-for="(q, i) in quizStore.questions" :key="i"
            class="answer-grid-item"
            :class="{
              'current': quizStore.currentIdx === i,
              'answered': quizStore.answers[i] !== undefined && !quizStore.flags[i] && (quizStore.mode === 'exam' || quizStore.currentIdx === i),
              'flagged': quizStore.flags[i],
              'correct-small': quizStore.mode === 'practice' && quizStore.answers[i] !== undefined && quizStore.answers[i] === quizStore.questions[i].ans && quizStore.currentIdx !== i,
              'wrong-small': quizStore.mode === 'practice' && quizStore.answers[i] !== undefined && quizStore.answers[i] !== quizStore.questions[i].ans && quizStore.currentIdx !== i
            }"
            @click="jumpTo(i)"
          >
            {{ i + 1 }}
          </div>
        </div>
        <button class="g-btn g-btn-primary w-full mt-8 shadow-[0_8px_25px_rgba(13,148,136,0.4)]" @click="finishQuiz">
          交卷 <i class="fas fa-file-export ml-1"></i>
        </button>
      </div>
    </div>
  </div>
</template>