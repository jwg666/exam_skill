<script setup lang="ts">
const router = useRouter()

const notifications = [
  { id: 1, title: '欢迎使用极客考证', content: '感谢您注册并使用我们的应用！祝您逢考必过！', time: '刚刚', type: 'system', read: false },
  { id: 2, title: '新题库上线', content: '《Vue3高级指南》题库已更新，快去挑战吧！', time: '2小时前', type: 'update', read: false },
  { id: 3, title: '打卡提醒', content: '您今天还没有打卡哦，坚持就是胜利！', time: '昨天', type: 'reminder', read: true }
]
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <div class="flex items-center justify-between mb-6 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.back()">
          <i class="fas fa-arrow-left"></i>
        </div>
        <h1 class="text-xl font-bold tracking-tight">消息通知</h1>
      </div>
      <button class="text-sm font-medium text-[#94A3B8] hover:text-teal-400 transition-colors">全部已读</button>
    </div>

    <div class="space-y-4">
      <div v-for="(n, i) in notifications" :key="n.id" class="g-card p-4 flex gap-4 fade-up" :class="n.read ? 'opacity-60' : ''" :style="{ animationDelay: `${i * 0.05}s` }">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" 
          :class="{
            'bg-blue-500/20 text-blue-400': n.type === 'system',
            'bg-teal-500/20 text-teal-400': n.type === 'update',
            'bg-orange-500/20 text-orange-400': n.type === 'reminder'
          }"
        >
          <i class="fas" :class="{
            'fa-info-circle': n.type === 'system',
            'fa-box-open': n.type === 'update',
            'fa-bell': n.type === 'reminder'
          }"></i>
        </div>
        <div class="flex-1 relative">
          <div v-if="!n.read" class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          <h3 class="text-sm font-bold mb-1" :class="n.read ? 'text-[#94A3B8]' : 'text-[#E8EDF5]'">{{ n.title }}</h3>
          <p class="text-xs text-[#64748B] leading-relaxed mb-2">{{ n.content }}</p>
          <p class="text-[10px] text-[#243049] font-medium">{{ n.time }}</p>
        </div>
      </div>
    </div>
  </div>
</template>