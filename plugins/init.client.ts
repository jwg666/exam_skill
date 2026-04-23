export default defineNuxtPlugin(() => {
  const appStore = useAppStore()
  appStore.recomputeStreak()
  if (appStore.user?.id) {
    void appStore.hydrateFromServer()
  }

  const applyThemeToDom = () => {
    const el = document.documentElement
    el.classList.toggle('theme-light', appStore.theme === 'light')
  }

  applyThemeToDom()
  watch(() => appStore.theme, applyThemeToDom)
})

