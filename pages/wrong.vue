<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { questionBanks } from '~/utils/data'

const appStore = useAppStore()
const router = useRouter()
const { $toast } = useNuxtApp()

const removeWrong = (qText: string) => {
  appStore.wrongBook = appStore.wrongBook.filter(w => w.q !== qText)
  $toast.success('已移除错题')
  if (appStore.wrongBook.length === 0) {
    appStore.checkAchievement('wrong_clear')
  }
}

const clearAll = () => {
  if (confirm('确定清空错题本吗？')) {
    appStore.wrongBook = []
    $toast.success('错题本已清空')
    appStore.checkAchievement('wrong_clear')
  }
}

const getBankName = (id: string) => {
  const bank = questionBanks.find(b => b.id === id)
  return bank ? bank.name : '未知题库'
}
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 头部区域 -->
    <div class="flex items-center justify-between mb-6 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <h1 class="text-xl font-bold tracking-tight">错题本</h1>
      </div>
      <button v-if="appStore.wrongBook.length > 0" class="text-sm font-medium text-red-400 hover:text-red-300 transition-colors" @click="clearAll">
        <i class="fas fa-trash-alt mr-1"></i>清空
      </button>
    </div>

    <!-- 错题列表 -->
    <div class="space-y-4">
      <div v-if="appStore.wrongBook.length === 0" class="text-center py-20 fade-up">
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
        <div v-for="(w, i) in appStore.wrongBook" :key="w.q" class="g-card p-5 relative overflow-hidden group fade-up" :style="{ animationDelay: `${i * 0.05}s` }">
          <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500"></div>
          <div class="flex items-start justify-between gap-4 mb-3 pl-2">
            <h3 class="text-[15px] font-bold leading-relaxed text-justify">{{ w.q }}</h3>
            <button class="w-8 h-8 rounded-lg bg-[#162032] flex items-center justify-center text-[#64748B] hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0" @click="removeWrong(w.q)">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          <div class="pl-2 mb-4">
            <p class="text-sm text-[#94A3B8] leading-relaxed">
              正确答案：<span class="text-green-400 font-bold ml-1">{{ String.fromCharCode(65 + w.ans) }}</span>
            </p>
          </div>
          <div class="pl-2 pt-3 border-t border-[#243049] flex items-center justify-between text-xs text-[#64748B] font-medium">
            <span class="flex items-center gap-1.5">
              <i class="fas fa-book text-[#14B8A6]"></i> {{ getBankName(w.bankId) }}
            </span>
            <span class="flex items-center gap-1.5">
              <i class="fas fa-times-circle text-red-400"></i> 错误 {{ w.errCount || 1 }} 次
            </span>
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