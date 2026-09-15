<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

const loading = ref(true)
const notifications = ref<any[]>([])

const load = async () => {
  try {
    const res = await $api<any>('/api/notifications')
    notifications.value = res.list
    appStore.unreadCount = res.unread
  } catch {
    $toast.error('加载通知失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const markAllRead = async () => {
  try {
    await $api('/api/notifications/read-all', { method: 'POST' })
    notifications.value = notifications.value.map(n => ({ ...n, is_read: 1 }))
    appStore.unreadCount = 0
    $toast.success('已全部标记为已读')
  } catch {
    $toast.error('操作失败')
  }
}

const formatTime = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)} 天前`
  return `${d.getMonth() + 1}-${d.getDate()}`
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
      <button v-if="appStore.unreadCount > 0" class="text-sm font-medium text-[#94A3B8] hover:text-teal-400 transition-colors" @click="markAllRead">全部已读</button>
    </div>

    <div class="space-y-4">
      <div v-if="loading" class="text-center py-20 text-[#94A3B8]">
        <i class="fas fa-spinner fa-spin text-2xl"></i>
      </div>
      <div v-else-if="notifications.length === 0" class="text-center py-20 fade-up">
        <div class="w-24 h-24 rounded-full bg-[#162032] flex items-center justify-center mx-auto mb-4 border border-[#243049]/50 shadow-inner">
          <i class="far fa-bell text-4xl text-[#64748B]"></i>
        </div>
        <p class="text-[#94A3B8] font-medium">暂无消息</p>
      </div>

      <div v-for="(n, i) in notifications" :key="n.id" class="g-card p-4 flex gap-4 fade-up" :class="n.is_read ? 'opacity-60' : ''" :style="{ animationDelay: `${i * 0.05}s` }">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          :class="{
            'bg-amber-500/20 text-amber-400': n.type === 'achievement',
            'bg-blue-500/20 text-blue-400': n.type === 'system',
            'bg-teal-500/20 text-teal-400': n.type === 'ranking'
          }"
        >
          <i class="fas" :class="{
            'fa-trophy': n.type === 'achievement',
            'fa-info-circle': n.type === 'system',
            'fa-ranking-star': n.type === 'ranking'
          }"></i>
        </div>
        <div class="flex-1 relative">
          <div v-if="!n.is_read" class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          <h3 class="text-sm font-bold mb-1" :class="n.is_read ? 'text-[#94A3B8]' : 'text-[#E8EDF5]'">{{ n.title }}</h3>
          <p v-if="n.content" class="text-xs text-[#64748B] leading-relaxed mb-2">{{ n.content }}</p>
          <p class="text-[10px] text-[#475569] font-medium">{{ formatTime(n.created_at) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
