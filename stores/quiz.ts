import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useQuizStore = defineStore('quiz', () => {
  const bankId = useStorage<string | null>('quizState_bankId', null)
  const questions = useStorage<any[]>('quizState_questions', [])
  const currentIdx = useStorage('quizState_currentIdx', 0)
  const answers = useStorage<number[]>('quizState_answers', [])
  const flags = useStorage<boolean[]>('quizState_flags', [])
  const selectedOption = useStorage('quizState_selectedOption', -1)
  const answered = useStorage('quizState_answered', false)
  const startTime = useStorage('quizState_startTime', 0)
  const elapsed = useStorage('quizState_elapsed', 0)
  const mode = useStorage<'practice' | 'exam'>('quizState_mode', 'practice')

  function resetQuiz() {
    bankId.value = null
    questions.value = []
    currentIdx.value = 0
    answers.value = []
    flags.value = []
    selectedOption.value = -1
    answered.value = false
    startTime.value = 0
    elapsed.value = 0
    mode.value = 'practice'
  }

  return {
    bankId,
    questions,
    currentIdx,
    answers,
    flags,
    selectedOption,
    answered,
    startTime,
    elapsed,
    mode,
    resetQuiz
  }
})