export default defineNuxtPlugin((nuxtApp) => {
  const appStore = useAppStore()

  const api = $fetch.create({
    onRequest({ options }) {
      if (appStore.token) {
        options.headers = new Headers(options.headers)
        options.headers.set('Authorization', `Bearer ${appStore.token}`)
      }
    },
    onResponseError({ response }) {
      // token 失效统一踢回登录页
      if (response.status === 401 && import.meta.client) {
        appStore.resetData()
        appStore.token = ''
        appStore.user = null
        useRouter().push('/login')
      }
    }
  })

  return {
    provide: {
      api
    }
  }
})
