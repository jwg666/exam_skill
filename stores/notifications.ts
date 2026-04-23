import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export type NotificationType = 'system' | 'update' | 'rank' | 'achievement'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  content: string
  createdAt: number
  readAt: number | null
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function formatTimeAgo(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}小时前`
  if (diff < 7 * 24 * 60 * 60_000) return `${Math.floor(diff / (24 * 60 * 60_000))}天前`
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = useStorage<NotificationItem[]>('quizApp_notifications', [])
  const seeded = useStorage('quizApp_notificationsSeeded', false)

  const unreadCount = computed(() => notifications.value.filter(n => !n.readAt).length)

  async function refreshFromServer() {
    const appStore = useAppStore()
    if (!appStore.user?.id || !import.meta.client) return
    try {
      const res = await $fetch<any>('/api/me/notifications', { query: { userId: appStore.user.id } })
      if (!res?.ok) return
      notifications.value = (res.notifications || []) as NotificationItem[]
      seeded.value = true
    } catch {
      // ignore
    }
  }

  function ensureSeeded() {
    if (seeded.value) return
    seeded.value = true
    const now = Date.now()
    notifications.value.unshift(
      {
        id: uid(),
        type: 'system',
        title: '欢迎使用题海拾贝',
        content: '每天进步一点点，知识海洋任你游。',
        createdAt: now - 3 * 60_000,
        readAt: null
      },
      {
        id: uid(),
        type: 'update',
        title: '题库更新提示',
        content: '题库内容会不定期更新，快去看看有没有新题。',
        createdAt: now - 2 * 60 * 60_000,
        readAt: null
      },
      {
        id: uid(),
        type: 'rank',
        title: '排行榜提示',
        content: '坚持练习可以提升排行，试试每天打卡。',
        createdAt: now - 24 * 60 * 60_000,
        readAt: now - 24 * 60 * 60_000
      }
    )
    notifications.value = notifications.value.slice(0, 50)
  }

  function add(input: Omit<NotificationItem, 'id' | 'createdAt' | 'readAt'> & { createdAt?: number }) {
    ensureSeeded()
    notifications.value.unshift({
      id: uid(),
      type: input.type,
      title: input.title,
      content: input.content,
      createdAt: input.createdAt ?? Date.now(),
      readAt: null
    })
    notifications.value = notifications.value.slice(0, 50)
  }

  async function markRead(id: string) {
    const n = notifications.value.find(x => x.id === id)
    if (n && !n.readAt) n.readAt = Date.now()

    const appStore = useAppStore()
    if (appStore.user?.id && import.meta.client && /^\d+$/.test(id)) {
      try {
        await $fetch(`/api/me/notifications/${id}/read`, { method: 'POST', query: { userId: appStore.user.id } })
      } catch {
        // ignore
      }
    }
  }

  async function markAllRead() {
    const now = Date.now()
    notifications.value = notifications.value.map(n => (n.readAt ? n : { ...n, readAt: now }))

    const appStore = useAppStore()
    if (appStore.user?.id && import.meta.client) {
      try {
        await $fetch('/api/me/notifications/read-all', { method: 'POST', query: { userId: appStore.user.id } })
      } catch {
        // ignore
      }
    }
  }

  return {
    notifications,
    unreadCount,
    ensureSeeded,
    refreshFromServer,
    add,
    markRead,
    markAllRead
  }
})

