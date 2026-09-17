import { defineStore } from 'pinia'
import { useStorage, StorageSerializers } from '@vueuse/core'

// 单题答案：单选/判断为 number，多选为 number[]；未答为 undefined
export type QuizAnswer = number | number[]

export const useQuizStore = defineStore('quiz', () => {
  const bankId = useStorage<string | null>('quizState_bankId', null)
  const bankName = useStorage<string>('quizState_bankName', '')
  const kind = useStorage<'quiz' | 'assessment'>('quizState_kind', 'quiz')
  const questions = useStorage<any[]>('quizState_questions', [])
  const currentIdx = useStorage('quizState_currentIdx', 0)
  const answers = useStorage<Record<number, QuizAnswer>>('quizState_answers', {})
  const flags = useStorage<Record<number, boolean>>('quizState_flags', {})
  const selected = useStorage<number[]>('quizState_selected', [])
  const answered = useStorage('quizState_answered', false)
  const startTime = useStorage('quizState_startTime', 0)
  const elapsed = useStorage('quizState_elapsed', 0)
  const mode = useStorage<'practice' | 'exam'>('quizState_mode', 'practice')
  // 交卷后的结果快照（result 页展示用）
  // 默认值为 null 时 VueUse 会用 String() 序列化对象，必须显式指定对象序列化器
  const result = useStorage<any>('quizState_result', null, undefined, { serializer: StorageSerializers.object })
  // 自愈：清理历史版本写入的损坏数据（"[object Object]" 字符串）
  if (typeof result.value === 'string') result.value = null

  function isAnsweredAt(i: number): boolean {
    return answers.value[i] !== undefined
  }

  // 判分：多选须完全一致，单选/判断比较索引
  function isCorrectAt(i: number): boolean {
    const q = questions.value[i]
    const a = answers.value[i]
    if (!q || a === undefined || q.ans === undefined) return false
    if ((q.type || 'single') === 'multi') {
      const right: number[] = Array.isArray(q.ans) ? [...q.ans].sort() : []
      const got: number[] = Array.isArray(a) ? [...a].sort() : []
      return right.length === got.length && right.every((v, idx) => v === got[idx])
    }
    return a === q.ans
  }

  function resetQuiz() {
    bankId.value = null
    bankName.value = ''
    kind.value = 'quiz'
    questions.value = []
    currentIdx.value = 0
    answers.value = {}
    flags.value = {}
    selected.value = []
    answered.value = false
    startTime.value = 0
    elapsed.value = 0
    mode.value = 'practice'
    result.value = null
  }

  return {
    bankId,
    bankName,
    kind,
    questions,
    currentIdx,
    answers,
    flags,
    selected,
    answered,
    startTime,
    elapsed,
    mode,
    result,
    isAnsweredAt,
    isCorrectAt,
    resetQuiz
  }
})
