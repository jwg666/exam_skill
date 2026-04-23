export function getExamSkillMemberBindings() {
  const rc = useRuntimeConfig() as any
  return {
    appScope: (rc.examSkill?.memberAppScope || 'exam_skill').toString(),
    gamificationModule: (rc.examSkill?.gamificationModule || 'gamification').toString(),
    gamificationKey: (rc.examSkill?.gamificationKey || 'rules').toString(),
    runtimeRuleSetKind: (rc.examSkill?.runtimeRuleSetKind || 'runtime').toString(),
    runtimeRuleSetName: (rc.examSkill?.runtimeRuleSetName || 'exam-skill-runtime').toString(),
    runtimeRuleCacheTtlMs: Number(rc.examSkill?.runtimeRuleCacheTtlMs || 10_000),
  }
}
