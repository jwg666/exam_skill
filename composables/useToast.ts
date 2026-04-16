export interface ToastOptions {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const toasts = ref<ToastOptions[]>([])

export const useToast = () => {
  const add = (message: string, type: ToastOptions['type'] = 'info', duration = 2500) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2)
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  return {
    toasts,
    add,
    success: (msg: string, dur?: number) => add(msg, 'success', dur),
    error: (msg: string, dur?: number) => add(msg, 'error', dur),
    info: (msg: string, dur?: number) => add(msg, 'info', dur),
    warning: (msg: string, dur?: number) => add(msg, 'warning', dur)
  }
}