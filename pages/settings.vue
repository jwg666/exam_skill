<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <div class="page-header -mx-5 px-5 py-4 mb-6 flex items-center gap-3">
      <button
        class="w-9 h-9 rounded-xl flex items-center justify-center border"
        style="background: var(--card); border-color: var(--border); color: var(--fg)"
        @click="router.back()"
      >
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="flex-1">
        <div class="text-lg font-extrabold tracking-tight">系统设置</div>
        <div class="text-xs" style="color: var(--muted)">外观与偏好</div>
      </div>
    </div>

    <div class="g-card p-4 mb-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-bold">深色模式</div>
          <div class="text-xs mt-1" style="color: var(--muted)">
            当前：{{ appStore.theme === 'dark' ? '深色' : '浅色' }}
          </div>
        </div>
        <button
          class="g-btn g-btn-ghost px-4 py-2"
          @click="appStore.toggleTheme()"
        >
          <i class="fas" :class="appStore.theme === 'dark' ? 'fa-moon' : 'fa-sun'"></i>
          切换
        </button>
      </div>
    </div>

    <div class="g-card p-4">
      <div class="font-bold mb-2">关于</div>
      <div class="text-sm leading-6" style="color: var(--fg2)">
        题海拾贝 / 极客考证（示例项目）
      </div>
    </div>
  </div>
</template>

