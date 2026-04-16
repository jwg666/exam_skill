<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const searchQuery = ref('')

const { data: questionBanks } = await useFetch<any[]>('/api/banks')

const filteredBanks = computed(() => {
  let banks = questionBanks.value || []
  if (appStore.currentBankCategory !== 'all') {
    banks = banks.filter(b => b.type === appStore.currentBankCategory)
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

const categories = [
  { key: 'all', name: '全部' },
  { key: 'exam', name: '考试类' },
  { key: 'skill', name: '技能类' },
  { key: 'license', name: '资格类' },
  { key: 'language', name: '语言类' },
  { key: 'interest', name: '兴趣类' }
]

const setCategory = (cat: string) => {
  appStore.currentBankCategory = cat
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
          :key="cat.key"
          class="g-tag cursor-pointer border-none px-3.5 py-1.5"
          :class="appStore.currentBankCategory === cat.key ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] text-[var(--fg2)]'"
          @click="setCategory(cat.key)"
        >
          {{ cat.name }}
        </button>
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