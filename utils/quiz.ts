export type QuizSessionType = 'bank_practice' | 'bank_exam' | 'bank_random10' | 'wrong_retry'

export function pickRandom<T>(arr: T[], count: number) {
  if (arr.length <= count) return [...arr]
  // Fisher–Yates shuffle on copy, then slice
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a.slice(0, count)
}

export function getWrongQuestionsForBank(wrongBook: any[], bankId: string) {
  return (wrongBook || []).filter(w => w.bankId === bankId)
}

export function removeWrongByIds(wrongBook: any[], masteredIds: Array<string | number>) {
  const set = new Set(masteredIds.map(String))
  return (wrongBook || []).filter(w => !set.has(String(w.id)))
}

export type QuizSessionType = 'bank_practice' | 'bank_exam' | 'bank_random10' | 'wrong_retry'

export function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickRandom<T>(arr: T[], count: number) {
  if (count >= arr.length) return [...arr]
  const copy = [...arr]
  shuffleInPlace(copy)
  return copy.slice(0, count)
}

export function getWrongQuestionsForBank(wrongBook: any[], bankId: string) {
  return (wrongBook || []).filter(w => w?.bankId === bankId)
}

export function removeWrongByIds(wrongBook: any[], masteredIds: Array<string | number>) {
  if (!masteredIds.length) return wrongBook
  const set = new Set(masteredIds.map(String))
  return (wrongBook || []).filter(w => !set.has(String(w?.id ?? '')))
}

