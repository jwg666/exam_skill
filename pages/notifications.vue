<script setup lang="ts">
const router = useRouter()
import { useNotificationStore, formatTimeAgo } from '~/stores/notifications'
import { storeToRefs } from 'pinia'

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

onMounted(async () => {
  await notificationStore.refreshFromServer()
  notificationStore.ensureSeeded()
})

const markAllRead = async () => {
  await notificationStore.markAllRead()
  const { $toast } = useNuxtApp()
  $toast?.success('已全部标为已读')
}

const openItem = async (id: string) => {
  await notificationStore.markRead(id)
}
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <div class="flex items-center justify-between mb-6 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.back()">
          <i class="fas fa-arrow-left"></i>
        </div>
        <h1 class="text-xl font-bold tracking-tight">消息通知</h1>
      </div>
      <button class="text-sm font-medium text-[#94A3B8] hover:text-teal-400 transition-colors" @click="markAllRead">全部已读</button>
    </div>

    <div class="space-y-4">
      <div v-for="(n, i) in notifications" :key="n.id" class="g-card p-4 flex gap-4 fade-up cursor-pointer" :class="n.readAt ? 'opacity-60' : ''" :style="{ animationDelay: `${i * 0.05}s` }" @click="openItem(n.id)">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" 
          :class="{
            'bg-blue-500/20 text-blue-400': n.type === 'system',
            'bg-teal-500/20 text-teal-400': n.type === 'update',
            'bg-indigo-500/20 text-indigo-400': n.type === 'rank',
            'bg-amber-500/20 text-amber-400': n.type === 'achievement'
          }"
        >
          <i class="fas" :class="{
            'fa-info-circle': n.type === 'system',
            'fa-box-open': n.type === 'update',
            'fa-ranking-star': n.type === 'rank',
            'fa-trophy': n.type === 'achievement'
          }"></i>
        </div>
        <div class="flex-1 relative">
          <div v-if="!n.readAt" class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          <h3 class="text-sm font-bold mb-1" :class="n.readAt ? 'text-[#94A3B8]' : 'text-[#E8EDF5]'">{{ n.title }}</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-2">{{ n.content }}</p>
          <p class="text-[10px] text-[#243049] font-medium">{{ formatTimeAgo(n.createdAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>