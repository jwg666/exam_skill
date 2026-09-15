<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useQuizStore } from '~/stores/quiz'

const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

const loading = ref(true)

onMounted(async () => {
  try {
    appStore.favorites = await $api<any[]>('/api/favorites')
  } catch {
    $toast.error('加载收藏失败')
  } finally {
    loading.value = false
  }
})

const typeName = (f: any) => ({ single: '单选', judge: '判断', multi: '多选' })[f.type || 'single'] || '单选'
const ansText = (f: any) => {
  if (f.type === 'multi' && Array.isArray(f.ans)) return f.ans.map((a: number) => String.fromCharCode(65 + a)).join('、')
  return String.fromCharCode(65 + f.ans)
}

const removeFav = async (f: any) => {
  try {
    await $api<any>('/api/favorites', { method: 'POST', body: { questionId: f.questionId } })
    appStore.favorites = appStore.favorites.filter(x => x.questionId !== f.questionId)
    $toast.success('已取消收藏')
  } catch {
    $toast.error('操作失败')
  }
}

const retryOne = (f: any) => {
  const quizStore = useQuizStore()
  quizStore.resetQuiz()
  quizStore.bankId = f.bankId
  quizStore.bankName = `${f.bankName || ''} · 收藏重做`
  quizStore.mode = 'exam'
  quizStore.questions = [{ id: f.questionId, type: f.type, q: f.question, opts: f.opts, ans: f.ans, exp: f.exp }]
  quizStore.startTime = Date.now()
  router.push('/quiz')
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
        <h1 class="text-xl font-bold tracking-tight">收藏夹</h1>
      </div>
      <span class="text-sm font-medium text-[#94A3B8]">共 <span class="text-amber-400 font-bold">{{ appStore.favorites.length }}</span> 题</span>
    </div>

    <!-- 收藏列表 -->
    <div class="space-y-4">
      <div v-if="loading" class="text-center py-20 text-[#94A3B8]">
        <i class="fas fa-spinner fa-spin text-2xl"></i>
      </div>
      <div v-else-if="appStore.favorites.length === 0" class="text-center py-20 fade-up">
        <div class="w-24 h-24 rounded-full bg-[#162032] flex items-center justify-center mx-auto mb-4 border border-[#243049]/50 shadow-inner">
          <i class="fas fa-star text-4xl text-[#64748B]"></i>
        </div>
        <p class="text-[#94A3B8] font-medium">暂无收藏</p>
        <button class="g-btn g-btn-primary mt-6 px-6 py-2" @click="router.push('/bank')">
          去刷题 <i class="fas fa-arrow-right text-xs ml-1"></i>
        </button>
      </div>

      <TransitionGroup name="list">
        <div v-for="(f, i) in appStore.favorites" :key="f.id" class="g-card p-5 relative overflow-hidden group fade-up" :style="{ animationDelay: `${i * 0.05}s` }">
          <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
          <div class="flex items-start justify-between gap-4 mb-3 pl-2">
            <div class="flex items-start gap-2 min-w-0">
              <span class="g-tag text-[10px] py-0.5 px-1.5 shrink-0 mt-0.5" :class="f.type === 'multi' ? 'bg-purple-500/20 text-purple-400' : f.type === 'judge' ? 'bg-blue-500/20 text-blue-400' : 'bg-teal-500/20 text-teal-400'">{{ typeName(f) }}</span>
              <h3 class="text-[15px] font-bold leading-relaxed text-justify">{{ f.question }}</h3>
            </div>
            <button class="w-8 h-8 rounded-lg bg-[#162032] flex items-center justify-center text-[#64748B] hover:bg-amber-500/20 hover:text-amber-400 transition-colors shrink-0" @click="removeFav(f)">
              <i class="fas fa-star"></i>
            </button>
          </div>
          <div class="pl-2 mb-4">
            <p class="text-sm text-[#94A3B8] leading-relaxed">
              正确答案：<span class="text-green-400 font-bold ml-1">{{ ansText(f) }}</span>
            </p>
            <p v-if="f.exp" class="text-xs text-[#64748B] leading-relaxed mt-2">{{ f.exp }}</p>
          </div>
          <div class="pl-2 pt-3 border-t border-[#243049] flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span class="flex items-center gap-1.5">
              <i class="fas fa-book text-[#14B8A6]"></i> {{ f.bankName || '未知题库' }}
            </span>
            <button class="text-teal-400 hover:text-teal-300 transition-colors font-bold" @click="retryOne(f)">
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
