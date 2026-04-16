<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { storeToRefs } from 'pinia'

const route = useRoute()
const appStore = useAppStore()
const { wrongBook } = storeToRefs(appStore)

const isActive = (path: string) => {
  return route.path === path
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-[#0b1120eb] backdrop-blur-[20px] border-t border-[#243049] z-[100] pb-[env(safe-area-inset-bottom)]">
    <div class="flex">
      <NuxtLink to="/" class="flex-1 flex flex-col items-center py-2 gap-0.5 cursor-pointer transition-all duration-300 text-[#64748B] relative no-underline nav-item" :class="{ 'active': isActive('/') }">
        <i class="fas fa-home text-xl transition-transform duration-300"></i>
        <span class="text-[10px] font-medium">首页</span>
      </NuxtLink>
      <NuxtLink to="/bank" class="flex-1 flex flex-col items-center py-2 gap-0.5 cursor-pointer transition-all duration-300 text-[#64748B] relative no-underline nav-item" :class="{ 'active': isActive('/bank') }">
        <i class="fas fa-book text-xl transition-transform duration-300"></i>
        <span class="text-[10px] font-medium">题库</span>
      </NuxtLink>
      <NuxtLink to="/wrong" class="flex-1 flex flex-col items-center py-2 gap-0.5 cursor-pointer transition-all duration-300 text-[#64748B] relative no-underline nav-item" :class="{ 'active': isActive('/wrong') }">
        <i class="fas fa-times-circle text-xl transition-transform duration-300"></i>
        <span class="text-[10px] font-medium">错题</span>
        <span v-if="wrongBook.length > 0" class="absolute -top-1 ml-4 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold px-1">{{ wrongBook.length }}</span>
      </NuxtLink>
      <NuxtLink to="/profile" class="flex-1 flex flex-col items-center py-2 gap-0.5 cursor-pointer transition-all duration-300 text-[#64748B] relative no-underline nav-item" :class="{ 'active': isActive('/profile') }">
        <i class="fas fa-user text-xl transition-transform duration-300"></i>
        <span class="text-[10px] font-medium">我的</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.nav-item.active {
  color: #14B8A6;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: #14B8A6;
  border-radius: 2px;
}
.nav-item.active i {
  transform: scale(1.15);
}
</style>