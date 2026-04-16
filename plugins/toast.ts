import { defineNuxtPlugin } from '#app'
import { useToast } from '~/composables/useToast'

export default defineNuxtPlugin((nuxtApp) => {
  const toast = useToast()
  return {
    provide: {
      toast
    }
  }
})