export default defineNuxtPlugin(() => {
  const appStore = useAppStore()
  appStore.recomputeStreak()

  const applyThemeToDom = () => {
    const el = document.documentElement
    el.classList.toggle('theme-light', appStore.theme === 'light')
  }

  applyThemeToDom()
  watch(() => appStore.theme, applyThemeToDom)
})

