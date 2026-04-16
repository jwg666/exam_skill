<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  bank: any
}>()

const appStore = useAppStore()
const { bankProgress } = storeToRefs(appStore)

const progress = computed(() => {
  return bankProgress.value[props.bank.id] || 0
})

const percentage = computed(() => {
  if (!props.bank.total) return 0
  return Math.round((progress.value / props.bank.total) * 100)
})

const isCompleted = computed(() => {
  return progress.value >= props.bank.total
})

const diffColorClass = computed(() => {
  if (props.bank.difficulty === '简单') return 'text-green-400'
  if (props.bank.difficulty === '中等') return 'text-amber-400'
  if (props.bank.difficulty === '困难') return 'text-red-400'
  return 'text-gray-400'
})
</script>

<template>
  <NuxtLink :to="`/bank/${bank.id}`" class="g-card block relative overflow-hidden group cursor-pointer no-underline text-[#E8EDF5]">
    <div class="flex items-start gap-4">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110" :style="{ background: `rgba(${parseInt(bank.color.slice(1,3),16)},${parseInt(bank.color.slice(3,5),16)},${parseInt(bank.color.slice(5,7),16)},0.1)`, color: bank.color }">
        <i :class="[bank.icon, 'text-2xl']"></i>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-base font-bold truncate">{{ bank.name }}</h3>
          <span v-if="isCompleted" class="text-teal-500 text-sm"><i class="fas fa-check-circle"></i></span>
        </div>
        <p class="text-xs text-[#94A3B8] mb-2 truncate">{{ bank.desc }}</p>
        <div class="flex items-center gap-2 flex-wrap mb-3">
          <span class="g-tag" :class="`type-${bank.type}`">{{ bank.typeName }}</span>
          <span class="g-tag bg-[#1C2942] text-[#94A3B8]">
            <i class="fas fa-layer-group text-[10px]"></i> {{ bank.total }}题
          </span>
          <span class="g-tag bg-[#1C2942]" :class="diffColorClass">
            <i class="fas fa-fire text-[10px]"></i> {{ bank.difficulty }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex-1 progress-bar">
            <div class="progress-fill" :style="{ width: `${percentage}%` }"></div>
          </div>
          <span class="text-xs font-bold text-[#14B8A6]">{{ percentage }}%</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>