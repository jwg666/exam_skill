<script setup lang="ts">
import { useAppStore } from '~/stores/app'
const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  if (!appStore.user && route.path !== '/login') {
    router.push('/login')
  }
})

watch(() => route.path, () => {
  if (!appStore.user && route.path !== '/login') {
    router.push('/login')
  }
})
</script>

<template>
  <div class="page pb-20 bg-[#0B1120] min-h-screen text-[#E8EDF5]">
    <slot />
    <BottomNav />
  </div>
</template>