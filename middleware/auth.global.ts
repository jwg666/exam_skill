// 全局登录拦截：除登录页外均要求已登录
// token 存于 localStorage，服务端渲染阶段读不到，因此只在客户端执行检查
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (to.path === '/login') return
  const appStore = useAppStore()
  if (!appStore.token) {
    return navigateTo('/login')
  }
})
