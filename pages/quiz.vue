<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useQuizStore } from '~/stores/quiz'

definePageMeta({ layout: false })

const appStore = useAppStore()
const quizStore = useQuizStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

if (!quizStore.bankId || quizStore.questions.length === 0) {
  router.replace('/bank')
}

const q = computed(() => quizStore.questions[quizStore.currentIdx])
const qType = computed(() => q.value?.type || 'single')
const typeLabel = computed(() => ({ single: '单选', judge: '判断', multi: '多选' })[qType.value] || '单选')
const isFav = computed(() => appStore.favorites.some(f => f.questionId === q.value?.id))
const isFlagged = computed(() => !!quizStore.flags[quizStore.currentIdx])
const isMulti = computed(() => qType.value === 'multi')

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

const optionState = (i: number) => {
  const answered = quizStore.answered
  const practice = quizStore.mode === 'practice'
  if (isMulti.value) {
    const picked: number[] = Array.isArray(quizStore.answers[quizStore.currentIdx]) ? quizStore.answers[quizStore.currentIdx] : []
    const right: number[] = Array.isArray(q.value.ans) ? q.value.ans : []
    if (answered && practice) {
      if (right.includes(i)) return picked.includes(i) ? 'correct' : 'correct'
      if (picked.includes(i)) return 'wrong'
      return ''
    }
    return picked.includes(i) ? 'selected' : ''
  }
  if (answered && practice) {
    if (i === q.value.ans) return 'correct'
    if (quizStore.selected[0] === i) return 'wrong'
    return ''
  }
  return quizStore.selected[0] === i && (!answered || quizStore.mode === 'exam') ? 'selected' : ''
}

const toggleFav = async () => {
  if (!q.value) return
  try {
    const res = await $api<any>('/api/favorites', { method: 'POST', body: { questionId: q.value.id } })
    if (res.favorited) {
      appStore.favorites.push({ questionId: q.value.id, bankId: quizStore.bankId, question: q.value.q, opts: q.value.opts, ans: q.value.ans, type: qType.value, exp: q.value.exp })
      $toast.success('收藏成功')
    } else {
      appStore.favorites = appStore.favorites.filter(f => f.questionId !== q.value.id)
      $toast.info('已取消收藏')
    }
    appStore.toastAchievements(res.newlyUnlocked || [])
  } catch {
    $toast.error('操作失败')
  }
}

const toggleFlag = () => {
  quizStore.flags[quizStore.currentIdx] = !quizStore.flags[quizStore.currentIdx]
}

const selectOption = (idx: number) => {
  if (quizStore.answered && quizStore.mode === 'practice') return
  if (isMulti.value) {
    const arr = [...quizStore.selected]
    const pos = arr.indexOf(idx)
    if (pos > -1) arr.splice(pos, 1)
    else arr.push(idx)
    quizStore.selected = arr
  } else {
    quizStore.selected = [idx]
    // 单选/判断在考试模式下选择即提交
    if (quizStore.mode === 'exam') {
      submitAnswer()
    }
  }
}

const submitAnswer = () => {
  if (!isMulti.value && quizStore.selected.length !== 1) {
    $toast.warning('请先选择一个选项')
    return
  }
  if (isMulti.value && quizStore.selected.length === 0) {
    $toast.warning('请先选择选项（多选）')
    return
  }

  const cur = quizStore.currentIdx
  quizStore.answers[cur] = isMulti.value ? [...quizStore.selected].sort((a, b) => a - b) : quizStore.selected[0]
  quizStore.answered = true
  if (quizStore.mode === 'exam') {
    nextQuestion()
  }
}

const restoreAnswerAt = (i: number) => {
  const a = quizStore.answers[i]
  if (a === undefined) {
    quizStore.selected = []
    quizStore.answered = false
  } else {
    quizStore.selected = isMulti.value && Array.isArray(a) ? [...a] : [a as number]
    quizStore.answered = true
  }
}

const nextQuestion = () => {
  if (quizStore.currentIdx < quizStore.questions.length - 1) {
    quizStore.currentIdx++
    restoreAnswerAt(quizStore.currentIdx)
  } else {
    finishQuiz()
  }
}

const prevQuestion = () => {
  if (quizStore.currentIdx > 0) {
    quizStore.currentIdx--
    restoreAnswerAt(quizStore.currentIdx)
  }
}

const finishQuiz = async () => {
  const total = quizStore.questions.length
  const unanswered = quizStore.questions.filter((_, i) => !quizStore.isAnsweredAt(i)).length
  if (unanswered > 0 && !confirm(`还有 ${unanswered} 题未作答，确定交卷吗？`)) return

  quizStore.elapsed = Math.floor((Date.now() - quizStore.startTime) / 1000)

  let correct = 0
  const wrongQuestions: number[] = []
  for (let i = 0; i < total; i++) {
    if (quizStore.isCorrectAt(i)) {
      correct++
    } else {
      wrongQuestions.push(quizStore.questions[i].id)
    }
  }
  const score = Math.round((correct / total) * 100) || 0

  quizStore.result = {
    bankId: quizStore.bankId,
    bankName: quizStore.bankName,
    mode: quizStore.mode,
    total,
    correct,
    wrong: total - correct,
    score,
    elapsed: quizStore.elapsed
  }

  try {
    const res = await $api<any>('/api/quiz/submit', {
      method: 'POST',
      body: {
        bankId: quizStore.bankId,
        total,
        correct,
        timeSpent: quizStore.elapsed,
        wrongQuestions
      }
    })
    appStore.toastAchievements(res.newlyUnlocked || [])
    // 本地总量即时更新（下次登录以服务端为准）
    if (appStore.user) {
      appStore.user.totalAnswered = (appStore.user.totalAnswered || 0) + total
      appStore.user.totalCorrect = (appStore.user.totalCorrect || 0) + correct
    }
  } catch (e) {
    console.error('Submit to server failed', e)
    $toast.error('成绩上传失败，已本地记录')
  }

  router.push('/result')
}

const showSheet = ref(false)
const jumpTo = (i: number) => {
  quizStore.currentIdx = i
  restoreAnswerAt(i)
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
          <span class="g-tag bg-gradient-to-r text-white text-xs py-1 px-2.5 shrink-0"
            :class="isMulti ? 'from-purple-500 to-purple-400' : qType === 'judge' ? 'from-blue-500 to-blue-400' : 'from-teal-500 to-teal-400'">{{ typeLabel }}</span>
          <h2 class="text-lg font-bold leading-relaxed text-justify">{{ q.q }}</h2>
        </div>
        <p v-if="isMulti" class="text-xs text-purple-400/80 -mt-2 ml-[52px]">多选题：选出所有正确选项</p>
      </div>

      <div class="space-y-3 fade-up" style="animation-delay:0.1s">
        <div
          v-for="(opt, i) in q.opts" :key="i"
          class="quiz-option group"
          :class="optionState(i)"
          @click="selectOption(i)"
        >
          <div class="opt-label group-hover:bg-[#243049] transition-colors shadow-sm">{{ String.fromCharCode(65 + i) }}</div>
          <span class="flex-1 text-[15px] font-medium leading-relaxed">{{ opt }}</span>
          <i v-if="quizStore.answered && quizStore.mode === 'practice' && ((isMulti && Array.isArray(q.ans) && q.ans.includes(i)) || (!isMulti && i === q.ans))" class="fas fa-check-circle text-white text-lg"></i>
          <i v-if="quizStore.answered && quizStore.mode === 'practice' && !isMulti && quizStore.selected[0] === i && i !== q.ans" class="fas fa-times-circle text-white text-lg"></i>
        </div>
      </div>

      <!-- 解析 -->
      <div v-if="quizStore.answered && quizStore.mode === 'practice'" class="mt-8 p-5 bg-gradient-to-br from-[#1C2942] to-[#162032] border border-[#243049] rounded-2xl fade-up relative overflow-hidden shadow-lg">
        <div class="absolute top-0 left-0 w-1 h-full" :class="quizStore.isCorrectAt(quizStore.currentIdx) ? 'bg-green-500' : 'bg-red-500'"></div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold flex items-center gap-2">
            <i class="fas fa-lightbulb text-amber-400"></i> 答案解析
          </h3>
          <span class="text-sm font-bold" :class="quizStore.isCorrectAt(quizStore.currentIdx) ? 'text-green-500' : 'text-red-500'">
            {{ quizStore.isCorrectAt(quizStore.currentIdx) ? '回答正确' : '回答错误' }}
          </span>
        </div>
        <p class="text-sm text-[#94A3B8] leading-relaxed text-justify">
          正确答案：<span class="text-white font-bold">{{ isMulti ? (q.ans || []).map((a: number) => String.fromCharCode(65 + a)).join('、') : String.fromCharCode(65 + q.ans) }}</span>。{{ q.exp }}
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

      <button v-if="!quizStore.answered || isMulti" class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)] text-[15px] font-bold" :class="{ 'opacity-50 pointer-events-none': quizStore.answered && quizStore.mode === 'practice' && isMulti }" @click="submitAnswer">
        {{ quizStore.answered && isMulti ? '已提交' : isMulti ? '确认答案' : '提交答案' }} <i class="fas fa-paper-plane text-sm ml-1"></i>
      </button>
      <div v-if="quizStore.answered" class="flex flex-1 gap-2">
        <button class="g-btn g-btn-ghost flex-1 bg-[#162032] hover:bg-[#1C2942] hover:text-white border-[#243049]" @click="prevQuestion" :disabled="quizStore.currentIdx === 0" :class="{ 'opacity-50 cursor-not-allowed': quizStore.currentIdx === 0 }">
          <i class="fas fa-arrow-left text-sm mr-1"></i> 上一题
        </button>
        <button v-if="!isMulti || quizStore.mode === 'practice'" class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)]" @click="nextQuestion">
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
            v-for="(qq, i) in quizStore.questions" :key="i"
            class="answer-grid-item"
            :class="{
              'current': quizStore.currentIdx === i,
              'answered': quizStore.isAnsweredAt(i) && !quizStore.flags[i] && (quizStore.mode === 'exam' || quizStore.currentIdx === i),
              'flagged': quizStore.flags[i],
              'correct-small': quizStore.mode === 'practice' && quizStore.isAnsweredAt(i) && quizStore.isCorrectAt(i) && quizStore.currentIdx !== i,
              'wrong-small': quizStore.mode === 'practice' && quizStore.isAnsweredAt(i) && !quizStore.isCorrectAt(i) && quizStore.currentIdx !== i
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
