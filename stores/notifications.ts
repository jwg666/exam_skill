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

  function markRead(id: string) {
    const n = notifications.value.find(x => x.id === id)
    if (n && !n.readAt) n.readAt = Date.now()
  }

  function markAllRead() {
    const now = Date.now()
    notifications.value = notifications.value.map(n => (n.readAt ? n : { ...n, readAt: now }))
  }

  return {
    notifications,
    unreadCount,
    ensureSeeded,
    add,
    markRead,
    markAllRead
  }
})

import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export type NotificationType = 'system' | 'update' | 'rank' | 'achievement'

export type NotificationItem = {
  id: string
  title: string
  content: string
  type: NotificationType
  createdAt: number
  readAt: number | null
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function formatTimeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day} 天前`
  const d = new Date(ts)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = useStorage<NotificationItem[]>('quizApp_notifications', [])
  const seeded = useStorage('quizApp_notificationsSeeded', false)

  const unreadCount = computed(() => notifications.value.filter(n => !n.readAt).length)

  function ensureSeeded() {
    if (seeded.value) return
    seeded.value = true
    if (notifications.value.length > 0) return

    const now = Date.now()
    notifications.value = [
      {
        id: uid(),
        title: '欢迎使用极客考证',
        content: '系统公告：感谢你加入题海拾贝，祝你逢考必过！',
        type: 'system',
        createdAt: now - 2 * 60 * 1000,
        readAt: null
      },
      {
        id: uid(),
        title: '排行榜更新',
        content: '排行更新：你本周学习势头不错，继续冲刺！',
        type: 'rank',
        createdAt: now - 45 * 60 * 1000,
        readAt: null
      },
      {
        id: uid(),
        title: '题库更新提醒',
        content: '题库中心已更新内容，快去看看有没有新挑战。',
        type: 'update',
        createdAt: now - 3 * 60 * 60 * 1000,
        readAt: null
      }
    ]
  }

  function add(payload: Pick<NotificationItem, 'title' | 'content' | 'type'> & { id?: string; createdAt?: number }) {
    const item: NotificationItem = {
      id: payload.id || uid(),
      title: payload.title,
      content: payload.content,
      type: payload.type,
      createdAt: payload.createdAt ?? Date.now(),
      readAt: null
    }
    notifications.value = [item, ...notifications.value].slice(0, 50)
    return item.id
  }

  function markRead(id: string) {
    const n = notifications.value.find(x => x.id === id)
    if (!n || n.readAt) return
    n.readAt = Date.now()
  }

  function markAllRead() {
    const now = Date.now()
    notifications.value.forEach(n => {
      if (!n.readAt) n.readAt = now
    })
  }

  function clear() {
    notifications.value = []
    seeded.value = false
  }

  return {
    notifications,
    unreadCount,
    ensureSeeded,
    add,
    markRead,
    markAllRead,
    clear
  }
})

