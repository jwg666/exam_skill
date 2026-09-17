<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const searchQuery = ref('')
const currentBankCategory = useStorage('quizApp_currentBankCategory', 'all')

const { data: questionBanks } = await useFetch<any[]>('/api/banks')
const { data: serverCategories } = await useFetch<any[]>('/api/categories')

// 「全部」+ 服务端分类（管理后台可维护）
const categories = computed(() => [
  { code: 'all', name: '全部' },
  ...(serverCategories.value || []).map(c => ({ code: c.code, name: c.name }))
])

const filteredBanks = computed(() => {
  let banks = questionBanks.value || []
  if (currentBankCategory.value !== 'all') {
    banks = banks.filter(b => b.type === currentBankCategory.value)
  }
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    banks = banks.filter(b =>
      b.name.toLowerCase().includes(s) ||
      b.description?.toLowerCase().includes(s)
    )
  }
  return banks
})

const setCategory = (cat: string) => {
  currentBankCategory.value = cat
}
</script>

<template>
  <div class="page pb-20">
    <div class="page-header px-5 py-4">
      <h1 class="text-[22px] font-black">题库中心</h1>
    </div>

    <!-- 搜索栏 -->
    <div class="px-5 py-3">
      <div class="relative">
        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"></i>
        <input 
          v-model="searchQuery"
          type="text" 
          class="g-input pl-10 rounded-full" 
          placeholder="搜索题库..."
        >
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="scroll-x px-5 pb-3">
      <div class="flex gap-2">
        <button
          v-for="cat in categories"
          :key="cat.code"
          class="g-tag cursor-pointer border-none px-3.5 py-1.5"
          :class="currentBankCategory === cat.code ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] text-[var(--fg2)]'"
          @click="setCategory(cat.code)"
        >{{ cat.name }}</button>
      </div>
    </div>

    <!-- 题库列表 -->
    <div class="px-5 space-y-3">
      <div v-if="filteredBanks.length === 0" class="text-center py-16 text-[var(--muted)]">
        未找到相关题库
      </div>
      <BankCard 
        v-else
        v-for="(bank, index) in filteredBanks" 
        :key="bank.id" 
        :bank="bank" 
        :progress="appStore.bankProgress[bank.id] || 0"
        class="fade-up"
        :style="{ animationDelay: `${index * 0.05}s` }"
      />
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
  transform: translateY(20px);
}
</style>