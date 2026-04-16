<script setup lang="ts">
import { useToast } from '~/composables/useToast'
const { toasts } = useToast()
</script>

<template>
  <div class="fixed top-[60px] left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="px-6 py-3 rounded-xl text-sm font-medium backdrop-blur-md pointer-events-auto whitespace-nowrap shadow-lg"
        :class="{
          'bg-emerald-500/90 text-white': toast.type === 'success',
          'bg-red-500/90 text-white': toast.type === 'error',
          'bg-teal-600/90 text-white': toast.type === 'info',
          'bg-orange-500/90 text-white': toast.type === 'warning'
        }"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>