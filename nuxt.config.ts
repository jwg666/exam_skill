// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // 应用为登录后的移动端工具，页面完全依赖浏览器本地状态（答题现场、用户数据），
  // SSR 水合必然与服务端空壳不一致，关闭 SSR 改为纯 SPA 渲染
  ssr: false,
  runtimeConfig: {
    // SQLite 库文件路径（相对 cwd 或绝对路径）；数据库为应用同机 SQLite，
    // 变量名保持 DATABASE_FILE
    databaseFile: process.env.DATABASE_FILE || './data/exam.sqlite',
    authSecret: process.env.AUTH_SECRET || 'dev-secret-change-me'
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '极客考证',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#0B1120' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap' }
      ]
    }
  }
})
