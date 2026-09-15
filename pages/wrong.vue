<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useQuizStore } from '~/stores/quiz'

const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

const activeType = ref('all')
const loading = ref(true)

onMounted(async () => {
  try {
    appStore.wrongBook = await $api<any[]>('/api/wrong-book')
  } catch {
    $toast.error('加载错题失败')
  } finally {
    loading.value = false
  }
})

const typeName = (w: any) => ({ single: '单选', judge: '判断', multi: '多选' })[w.type || 'single'] || '单选'
const ansText = (w: any) => {
  if (w.type === 'multi' && Array.isArray(w.ans)) return w.ans.map((a: number) => String.fromCharCode(65 + a)).join('、')
  return String.fromCharCode(65 + w.ans)
}

const filtered = computed(() => {
  if (activeType.value === 'all') return appStore.wrongBook
  return appStore.wrongBook.filter(w => w.bankId === activeType.value)
})

const bankOptions = computed(() => {
  const map = new Map<string, string>()
  for (const w of appStore.wrongBook) map.set(w.bankId, w.bankName || w.bankId)
  return [...map.entries()].map(([id, name]) => ({ id, name }))
})

const removeWrong = async (w: any) => {
  try {
    const res = await $api<any>(`/api/wrong-book?id=${w.id}`, { method: 'DELETE' })
    appStore.wrongBook = appStore.wrongBook.filter(x => x.id !== w.id)
    appStore.toastAchievements(res.newlyUnlocked || [])
    $toast.success('已移除错题')
  } catch {
    $toast.error('操作失败')
  }
}

const clearAll = async () => {
  if (!confirm('确定清空错题本吗？')) return
  try {
    const res = await $api<any>('/api/wrong-book', { method: 'DELETE' })
    appStore.wrongBook = []
    appStore.toastAchievements(res.newlyUnlocked || [])
    $toast.success('错题本已清空')
  } catch {
    $toast.error('操作失败')
  }
}

const retryOne = (w: any) => {
  const quizStore = useQuizStore()
  quizStore.resetQuiz()
  quizStore.bankId = w.bankId
  quizStore.bankName = `${w.bankName || ''} · 错题重练`
  quizStore.mode = 'exam'
  quizStore.questions = [{ id: w.questionId, type: w.type, q: w.question, opts: w.opts, ans: w.ans, exp: w.exp }]
  quizStore.startTime = Date.now()
  router.push('/quiz')
}
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 头部区域 -->
    <div class="flex items-center justify-between mb-4 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold tracking-tight">错题本</h1>
      </div>
      <button v-if="appStore.wrongBook.length > 0" class="text-sm font-medium text-red-400 hover:text-red-300 transition-colors" @click="clearAll">
        <i class="fas fa-trash-alt mr-1"></i>清空
      </button>
    </div>

    <!-- 分类筛选 -->
    <div v-if="bankOptions.length > 1" class="scroll-x pb-3 mb-2">
      <div class="flex gap-2">
        <button class="g-tag cursor-pointer border-none px-3.5 py-1.5"
          :class="activeType === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] text-[var(--fg2)]'"
          @click="activeType = 'all'">全部</button>
        <button v-for="b in bankOptions" :key="b.id" class="g-tag cursor-pointer border-none px-3.5 py-1.5"
          :class="activeType === b.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] text-[var(--fg2)]'"
          @click="activeType = b.id">{{ b.name }}</button>
      </div>
    </div>

    <!-- 错题列表 -->
    <div class="space-y-4">
      <div v-if="loading" class="text-center py-20 text-[#94A3B8]">
        <i class="fas fa-spinner fa-spin text-2xl"></i>
      </div>
      <div v-else-if="filtered.length === 0" class="text-center py-20 fade-up">
        <div class="w-24 h-24 rounded-full bg-[#162032] flex items-center justify-center mx-auto mb-4 border border-[#243049]/50 shadow-inner">
          <i class="fas fa-check-double text-4xl text-emerald-500"></i>
        </div>
        <p class="text-[#94A3B8] font-medium mb-1">太棒了！没有错题</p>
        <p class="text-xs text-[#64748B]">继续保持，百尺竿头更进一步</p>
        <button class="g-btn g-btn-primary mt-6 px-6 py-2" @click="router.push('/bank')">
          去刷题 <i class="fas fa-arrow-right text-xs ml-1"></i>
        </button>
      </div>

      <TransitionGroup name="list">
        <div v-for="(w, i) in filtered" :key="w.id" class="g-card p-5 relative overflow-hidden group fade-up" :style="{ animationDelay: `${i * 0.05}s` }">
          <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
          <div class="flex items-start justify-between gap-4 mb-3 pl-2">
            <div class="flex items-start gap-2 min-w-0">
              <span class="g-tag text-[10px] py-0.5 px-1.5 shrink-0 mt-0.5" :class="w.type === 'multi' ? 'bg-purple-500/20 text-purple-400' : w.type === 'judge' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal-500/20 text-teal-400'">{{ typeName(w) }}</span>
              <h3 class="text-[15px] font-bold leading-relaxed text-justify">{{ w.question }}</h3>
            </div>
            <button class="w-8 h-8 rounded-lg bg-[#162032] flex items-center justify-center text-[#64748B] hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0" @click="removeWrong(w)">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          <div class="pl-2 mb-4">
            <p class="text-sm text-[#94A3B8] leading-relaxed">
              正确答案：<span class="text-green-400 font-bold ml-1">{{ ansText(w) }}</span>
            </p>
            <p v-if="w.exp" class="text-xs text-[#64748B] leading-relaxed mt-2">{{ w.exp }}</p>
          </div>
          <div class="pl-2 pt-3 border-t border-[#243049] flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span class="flex items-center gap-1.5">
              <i class="fas fa-book text-[#14B8A6]"></i> {{ w.bankName || '未知题库' }}
            </span>
            <button class="text-teal-400 hover:text-teal-300 transition-colors font-bold" @click="retryOne(w)">
              <i class="fas fa-redo mr-1"></i>重做
            </button>
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
