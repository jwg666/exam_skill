<script setup lang="ts">
import { useAppStore } from '~/stores/app'

definePageMeta({
  layout: false
})

const isLoginMode = ref(true)
// 登录子模式：password=密码登录（存量账号） / sms=验证码登录
const authMode = ref<'password' | 'sms'>('password')
const phone = ref('')
const password = ref('')
const name = ref('')
const code = ref('')
const isPasswordVisible = ref(false)
const submitting = ref(false)
const countdown = ref(0)
const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

let countdownTimer: ReturnType<typeof setInterval> | null = null

function startCountdown() {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

const sendCode = async () => {
  if (!/^1\d{10}$/.test(phone.value.trim())) {
    $toast.error('请输入正确的手机号')
    return
  }
  if (countdown.value > 0) return
  try {
    const res = await $api<any>('/api/auth/sms/send', {
      method: 'POST',
      body: { phone: phone.value.trim() }
    })
    startCountdown()
    if (res.provider === 'mock') {
      $toast.info('当前为开发模式，验证码请输入 123456')
    } else {
      $toast.success('验证码已发送，请注意查收短信')
    }
  } catch (e: any) {
    $toast.error(e?.data?.message || '验证码发送失败')
  }
}

const afterAuth = async (data: any, msg: string) => {
  appStore.setSession(data)
  appStore.toastAchievements(data.newlyUnlocked || [])
  $toast.success(msg)
  await appStore.fetchAll()
  router.push('/')
}

const handleLogin = async () => {
  if (!phone.value || (authMode.value === 'password' ? !password.value : !code.value)) {
    $toast.error(authMode.value === 'password' ? '请输入手机号和密码' : '请输入手机号和验证码')
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const body = authMode.value === 'password'
      ? { phone: phone.value.trim(), password: password.value }
      : { phone: phone.value.trim(), code: code.value.trim() }
    const data = await $api<any>('/api/auth/login', { method: 'POST', body })
    await afterAuth(data, '登录成功')
  } catch (e: any) {
    $toast.error(e?.data?.message || '网络错误')
  } finally {
    submitting.value = false
  }
}

const handleRegister = async () => {
  if (!phone.value || !code.value) {
    $toast.error('请输入手机号和验证码')
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    const data = await $api<any>('/api/auth/register', {
      method: 'POST',
      body: { name: name.value.trim(), phone: phone.value.trim(), code: code.value.trim() }
    })
    await afterAuth(data, '注册成功')
  } catch (e: any) {
    $toast.error(e?.data?.message || '网络错误')
  } finally {
    submitting.value = false
  }
}

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  phone.value = ''
  password.value = ''
  name.value = ''
  code.value = ''
  authMode.value = 'password'
}
</script>

<template>
  <div class="page flex items-center justify-center relative overflow-hidden bg-[#0B1120] text-[#E8EDF5]">
    <div class="login-bg pointer-events-none">
      <div class="login-blob w-[400px] h-[400px] bg-teal-500 -top-[100px] -left-[100px]"></div>
      <div class="login-blob w-[300px] h-[300px] bg-blue-600 top-[20%] right-[10%] animation-delay-[-2s]"></div>
      <div class="login-blob w-[350px] h-[350px] bg-purple-600 bottom-[-50px] left-[20%] animation-delay-[-4s]"></div>
    </div>

    <div class="floating-particle w-1.5 h-1.5 bg-teal-400 left-[10%] bottom-0 animation-delay-[0s] animation-duration-[12s]"></div>
    <div class="floating-particle w-2.5 h-2.5 bg-blue-400 left-[40%] bottom-0 animation-delay-[-5s] animation-duration-[15s]"></div>
    <div class="floating-particle w-1.5 h-1.5 bg-purple-400 left-[80%] bottom-0 animation-delay-[-2s] animation-duration-[10s]"></div>

    <div class="w-full max-w-sm px-6 relative z-10 fade-up">
      <div class="text-center mb-10">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-400 mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(13,148,136,0.4)]">
          <i class="fas fa-water text-4xl text-white"></i>
        </div>
        <h1 class="text-3xl font-bold mb-3 tracking-tight font-zcool">题海拾贝</h1>
        <p class="text-[#94A3B8] text-[15px]">每天进步一点点，知识海洋任你游</p>
      </div>

      <div class="g-card p-6 md:p-8 backdrop-blur-xl bg-[#162032]/80">
        <!-- 登录 -->
        <div class="space-y-5" v-if="isLoginMode">
          <!-- 登录方式切换 -->
          <div class="flex bg-[#0B1120]/50 rounded-xl p-1 border border-[#243049]">
            <button
              class="flex-1 py-2 text-sm font-bold rounded-lg transition-all"
              :class="authMode === 'password' ? 'bg-[#14B8A6] text-white shadow-[0_2px_10px_rgba(13,148,136,0.3)]' : 'text-[#64748B]'"
              @click="authMode = 'password'"
            >密码登录</button>
            <button
              class="flex-1 py-2 text-sm font-bold rounded-lg transition-all"
              :class="authMode === 'sms' ? 'bg-[#14B8A6] text-white shadow-[0_2px_10px_rgba(13,148,136,0.3)]' : 'text-[#64748B]'"
              @click="authMode = 'sms'"
            >验证码登录</button>
          </div>

          <div class="relative group">
            <i class="fas fa-mobile-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
            <input
              v-model="phone"
              type="tel"
              placeholder="请输入手机号"
              class="g-input pl-11 bg-[#0B1120]/50"
              @keyup.enter="handleLogin"
            >
          </div>

          <!-- 密码登录 -->
          <div v-if="authMode === 'password'" class="relative group">
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
            <input
              v-model="password"
              :type="isPasswordVisible ? 'text' : 'password'"
              placeholder="请输入密码"
              class="g-input pl-11 pr-11 bg-[#0B1120]/50"
              @keyup.enter="handleLogin"
            >
            <button
              class="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
              @click="isPasswordVisible = !isPasswordVisible"
            >
              <i class="fas" :class="isPasswordVisible ? 'fa-eye' : 'fa-eye-slash'"></i>
            </button>
          </div>

          <!-- 验证码登录 -->
          <div v-else class="flex gap-3">
            <div class="relative group flex-1">
              <i class="fas fa-shield-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
              <input
                v-model="code"
                type="text"
                maxlength="6"
                inputmode="numeric"
                placeholder="请输入验证码"
                class="g-input pl-11 bg-[#0B1120]/50"
                @keyup.enter="handleLogin"
              >
            </div>
            <button
              class="g-btn g-btn-ghost px-4 py-2.5 bg-[#162032] border-[#243049] text-sm whitespace-nowrap"
              :class="countdown > 0 ? 'opacity-50 cursor-default' : 'text-teal-400'"
              @click="sendCode"
            >{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</button>
          </div>

          <button class="g-btn g-btn-primary w-full mt-2" :disabled="submitting" @click="handleLogin">
            {{ submitting ? '登录中…' : '登录' }}
          </button>

          <div class="mt-6 flex items-center justify-center text-sm text-[#64748B]">
            <span class="hover:text-teal-500 cursor-pointer transition-colors" @click="toggleMode">还没有账号？去注册</span>
          </div>
        </div>

        <!-- 注册 -->
        <div class="space-y-5" v-else>
          <div class="relative group">
            <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
            <input
              v-model="name"
              type="text"
              maxlength="20"
              placeholder="昵称（选填，默认使用手机号）"
              class="g-input pl-11 bg-[#0B1120]/50"
            >
          </div>

          <div class="relative group">
            <i class="fas fa-mobile-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
            <input
              v-model="phone"
              type="tel"
              placeholder="请输入手机号"
              class="g-input pl-11 bg-[#0B1120]/50"
            >
          </div>

          <div class="flex gap-3">
            <div class="relative group flex-1">
              <i class="fas fa-shield-alt absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
              <input
                v-model="code"
                type="text"
                maxlength="6"
                inputmode="numeric"
                placeholder="请输入验证码"
                class="g-input pl-11 bg-[#0B1120]/50"
                @keyup.enter="handleRegister"
              >
            </div>
            <button
              class="g-btn g-btn-ghost px-4 py-2.5 bg-[#162032] border-[#243049] text-sm whitespace-nowrap"
              :class="countdown > 0 ? 'opacity-50 cursor-default' : 'text-teal-400'"
              @click="sendCode"
            >{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</button>
          </div>

          <button class="g-btn g-btn-primary w-full mt-2" :disabled="submitting" @click="handleRegister">
            {{ submitting ? '注册中…' : '注册' }}
          </button>

          <div class="mt-6 flex items-center justify-center text-sm text-[#64748B]">
            <span class="hover:text-teal-500 cursor-pointer transition-colors" @click="toggleMode">已有账号？去登录</span>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-[#64748B] mt-8">
        登录即代表同意 <span class="text-teal-500 cursor-pointer">用户协议</span> 与 <span class="text-teal-500 cursor-pointer">隐私政策</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.font-zcool {
  font-family: 'ZCOOL KuaiLe', sans-serif;
}
.animation-delay-\[-2s\] { animation-delay: -2s; }
.animation-delay-\[-4s\] { animation-delay: -4s; }
.animation-delay-\[-5s\] { animation-delay: -5s; }
.animation-duration-\[12s\] { animation-duration: 12s; }
.animation-duration-\[15s\] { animation-duration: 15s; }
.animation-duration-\[10s\] { animation-duration: 10s; }
</style>
