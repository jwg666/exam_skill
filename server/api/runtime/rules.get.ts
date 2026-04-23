import { loadRuntimeRulesForServer } from '../../utils/runtimeRulesCache'

export default defineEventHandler(async () => {
  const r = await loadRuntimeRulesForServer()
  return r
})

