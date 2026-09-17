// 全局登录拦截：题库广场对游客开放，个人/答题相关页面需要登录
// token 存于 localStorage，服务端渲染阶段读不到，因此只在客户端执行检查
const PUBLIC_PATHS = ['/', '/bank', '/login']

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (PUBLIC_PATHS.includes(to.path)) return
  const appStore = useAppStore()
  if (!appStore.token) {
    return navigateTo('/login')
  }
})
