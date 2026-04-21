import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { QuizSessionType } from '~/utils/quiz'

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
  // 用于区分出题策略来源（题库顺序/考试/随机10/错题重练）
  const sessionType = useStorage<QuizSessionType>('quizState_sessionType', 'bank_practice')
  // 是否允许更新 bankProgress（仅题库顺序练习需要）
  const progressEnabled = useStorage('quizState_progressEnabled', true)

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
    sessionType.value = 'bank_practice'
    progressEnabled.value = true
  }

  function startSession(params: {
    bankId: string
    questions: any[]
    mode: 'practice' | 'exam'
    startIndex?: number
    sessionType: QuizSessionType
    progressEnabled?: boolean
  }) {
    resetQuiz()
    bankId.value = params.bankId
    mode.value = params.mode
    sessionType.value = params.sessionType
    progressEnabled.value = params.progressEnabled ?? (params.sessionType === 'bank_practice')
    questions.value = params.questions || []
    currentIdx.value = Math.max(0, Math.min(params.startIndex ?? 0, Math.max(0, questions.value.length - 1)))
    startTime.value = Date.now()
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
    sessionType,
    progressEnabled,
    resetQuiz,
    startSession
  }
})