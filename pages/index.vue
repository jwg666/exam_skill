<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
</script>

<template>
  <div class="pb-20">
    <div class="page-header px-5 py-4 flex items-center justify-between sticky top-0 z-30 bg-[#0B1120]/90 backdrop-blur">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center shadow-[0_0_20px_rgba(13,148,136,0.35)]">
          <i class="fas fa-water text-white"></i>
        </div>
        <h1 class="text-[22px] font-black">题海拾贝</h1>
      </div>
      <button v-if="!appStore.token" class="g-btn g-btn-primary px-4 py-2 text-sm" @click="router.push('/login')">
        登录 / 注册
      </button>
    </div>
    <div v-if="!appStore.token" class="px-5 pb-2">
      <p class="text-xs text-[#64748B]">浏览题库无需登录，开始刷题后自动生成学习记录</p>
    </div>
    <BankCenter />
  </div>
</template>
