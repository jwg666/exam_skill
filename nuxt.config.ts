// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    passwordAesSecret: process.env.NUXT_PASSWORD_AES_SECRET || '',
    sms: {
      aliyun: {
        accessKeyId: process.env.NUXT_ALIYUN_ACCESS_KEY_ID || '',
        accessKeySecret: process.env.NUXT_ALIYUN_ACCESS_KEY_SECRET || '',
        signName: process.env.NUXT_ALIYUN_SMS_SIGN_NAME || '',
        templateCode: process.env.NUXT_ALIYUN_SMS_TEMPLATE_CODE || '',
        endpoint: process.env.NUXT_ALIYUN_SMS_ENDPOINT || 'https://dysmsapi.aliyuncs.com',
        regionId: process.env.NUXT_ALIYUN_SMS_REGION_ID || 'cn-hangzhou',
      },
      debugReturnCode: process.env.NUXT_SMS_DEBUG_RETURN_CODE === '1',
    },
    // 与 admin-center 对齐：用于读取已发布的 rules/configs（config_items / rule_sets）
    mysql: {
      host: process.env.NUXT_MYSQL_HOST || '',
      port: Number(process.env.NUXT_MYSQL_PORT || 3306),
      user: process.env.NUXT_MYSQL_USER || '',
      password: process.env.NUXT_MYSQL_PASSWORD || '',
      database: process.env.NUXT_MYSQL_DATABASE || '',
      connectionLimit: Number(process.env.NUXT_MYSQL_CONNECTION_LIMIT || 10),
    },
    examSkill: {
      memberAppScope: process.env.EXAM_SKILL_MEMBER_APP_SCOPE || 'exam_skill',
      gamificationModule: process.env.EXAM_SKILL_GAMIFICATION_MODULE || 'gamification',
      gamificationKey: process.env.EXAM_SKILL_GAMIFICATION_KEY || 'rules',
      runtimeRuleSetKind: process.env.EXAM_SKILL_RUNTIME_RULE_SET_KIND || 'runtime',
      runtimeRuleSetName: process.env.EXAM_SKILL_RUNTIME_RULE_SET_NAME || 'exam-skill-runtime',
      runtimeRuleCacheTtlMs: Number(process.env.EXAM_SKILL_RUNTIME_RULE_CACHE_TTL_MS || 10_000),
    },
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
      ]
    }
  }
})
