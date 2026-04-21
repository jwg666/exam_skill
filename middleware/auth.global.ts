export default defineNuxtRouteMiddleware((to) => {
  // useStorage 依赖 localStorage；避免 SSR 首屏误判为未登录
  if (import.meta.server) return

  if (to.path === '/login') return

  const appStore = useAppStore()
  if (!appStore.user) {
    return navigateTo('/login')
  }
})

