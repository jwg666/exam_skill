<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useNotificationStore } from '~/stores/notifications'

definePageMeta({
  layout: false
})

const isLoginMode = ref(true)
const loginMethod = ref<'password' | 'sms'>('password')
const phone = ref('')
const password = ref('')
const code = ref('')
const name = ref('')
const isPasswordVisible = ref(false)
const sending = ref(false)
const cooldown = ref(0)
let cooldownTimer: any = null
const appStore = useAppStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const { $toast } = useNuxtApp()

const handleLogin = async () => {
  if (!phone.value) {
    $toast.error('请输入手机号')
    return
  }
  
  try {
    const api = loginMethod.value === 'sms' ? '/api/auth/login-code' : '/api/auth/login'
    const body =
      loginMethod.value === 'sms'
        ? { phone: phone.value, code: code.value }
        : { phone: phone.value, password: password.value }

    const { data, error } = await useFetch(api, { method: 'POST', body })

    if (error.value) {
      $toast.error(error.value.data?.message || '登录失败')
      return
    }

    appStore.syncUserData(data.value)
    await appStore.hydrateFromServer()
    await notificationStore.refreshFromServer()
    await appStore.checkAchievement('first_login')
    $toast.success('登录成功')
    
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (e) {
    $toast.error('网络错误')
  }
}

const sendCode = async () => {
  if (!phone.value) {
    $toast.error('请输入手机号')
    return
  }
  if (cooldown.value > 0 || sending.value) return
  sending.value = true
  try {
    const res = await $fetch<any>('/api/auth/sms/send', { method: 'POST', body: { phone: phone.value } })
    if (res?.code) {
      // debugReturnCode=1 时便于联调
      $toast.info(`验证码：${res.code}`)
      code.value = res.code
    } else {
      $toast.success('验证码已发送')
    }
    cooldown.value = 60
    clearInterval(cooldownTimer)
    cooldownTimer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0) clearInterval(cooldownTimer)
    }, 1000)
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

const handleRegister = async () => {
  if (!name.value || !phone.value || !password.value) {
    $toast.error('请填写完整信息')
    return
  }

  if (password.value.length < 6) {
    $toast.error('密码不能少于6位')
    return
  }

  try {
    const { data, error } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: { name: name.value, phone: phone.value, password: password.value }
    })

    if (error.value) {
      $toast.error(error.value.data?.message || '注册失败')
      return
    }

    appStore.syncUserData(data.value)
    await appStore.hydrateFromServer()
    await notificationStore.refreshFromServer()
    await appStore.checkAchievement('first_login')
    $toast.success('注册成功')
    
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (e) {
    $toast.error('网络错误')
  }
}

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  phone.value = ''
  password.value = ''
  code.value = ''
  name.value = ''
}

onMounted(() => {
  if (appStore.user) {
    router.push('/')
  }
})

onUnmounted(() => {
  clearInterval(cooldownTimer)
})
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
        <div class="space-y-5" v-if="isLoginMode">
          <div class="flex gap-2 text-xs font-bold mb-1">
            <button
              class="flex-1 py-2 rounded-xl border"
              :class="loginMethod === 'password' ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' : 'bg-[#0B1120]/40 border-[#243049] text-[#94A3B8]'"
              @click="loginMethod = 'password'"
            >
              密码登录
            </button>
            <button
              class="flex-1 py-2 rounded-xl border"
              :class="loginMethod === 'sms' ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' : 'bg-[#0B1120]/40 border-[#243049] text-[#94A3B8]'"
              @click="loginMethod = 'sms'"
            >
              验证码登录
            </button>
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
          
          <div v-if="loginMethod === 'password'" class="relative group">
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

          <div v-else class="relative group">
            <i class="fas fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
            <input 
              v-model="code" 
              type="text" 
              inputmode="numeric"
              maxlength="6"
              placeholder="请输入验证码" 
              class="g-input pl-11 pr-28 bg-[#0B1120]/50"
              @keyup.enter="handleLogin"
            >
            <button
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-3 py-2 rounded-lg border"
              :class="cooldown > 0 || sending ? 'bg-[#0B1120]/40 border-[#243049] text-[#64748B] cursor-not-allowed' : 'bg-teal-500/20 border-teal-500/30 text-teal-300 hover:bg-teal-500/30'"
              @click="sendCode"
            >
              {{ cooldown > 0 ? `${cooldown}s` : '发送验证码' }}
            </button>
          </div>

          <button class="g-btn g-btn-primary w-full mt-2" @click="handleLogin">
            登录
          </button>
          
          <div class="mt-6 flex items-center justify-center text-sm text-[#64748B]">
            <span class="hover:text-teal-500 cursor-pointer transition-colors" @click="toggleMode">还没有账号？去注册</span>
          </div>
        </div>

        <div class="space-y-5" v-else>
          <div class="relative group">
            <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
            <input 
              v-model="name" 
              type="text" 
              placeholder="请输入昵称" 
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
          
          <div class="relative group">
            <i class="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] transition-colors duration-300 group-focus-within:text-teal-500"></i>
            <input 
              v-model="password" 
              :type="isPasswordVisible ? 'text' : 'password'" 
              placeholder="请设置密码" 
              class="g-input pl-11 pr-11 bg-[#0B1120]/50"
              @keyup.enter="handleRegister"
            >
            <button 
              class="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
              @click="isPasswordVisible = !isPasswordVisible"
            >
              <i class="fas" :class="isPasswordVisible ? 'fa-eye' : 'fa-eye-slash'"></i>
            </button>
          </div>

          <button class="g-btn g-btn-primary w-full mt-2" @click="handleRegister">
            注册
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