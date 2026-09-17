<script setup lang="ts">
import { useQuizStore } from '~/stores/quiz'

definePageMeta({ layout: false })

const quizStore = useQuizStore()
const router = useRouter()

const r = computed(() => quizStore.result)
if (!r.value) {
  router.replace('/')
}

const report = computed(() => r.value?.report || null)
const isMbti = computed(() => report.value?.kind === 'mbti')
const isIq = computed(() => report.value?.kind === 'iq')

// 圆环中心：MBTI 显示人格代码，IQ 显示智商值，普通题显示百分制分数
const centerText = computed(() => {
  if (isMbti.value) return report.value.typeCode
  return String(r.value?.score ?? 0)
})
const centerLabel = computed(() => {
  if (isMbti.value) return '人格类型'
  if (isIq.value) return 'IQ · ' + report.value.tier
  return '分'
})
// 圆环进度：MBTI 用完成度，IQ 按智商值映射（60-145 → 0-100%）
const ringPct = computed(() => {
  if (isMbti.value) return 100
  if (isIq.value) return Math.min(100, Math.max(0, ((report.value.iq - 60) / 85) * 100))
  return r.value?.score || 0
})

const comment = computed(() => {
  if (isMbti.value) return report.value.tagline
  if (isIq.value) return report.value.advice
  const score = r.value?.score || 0
  if (score === 100) return '完美无瑕！全部答对，你就是题海之王！'
  if (score >= 80) return '非常出色！继续保持这个状态。'
  if (score >= 60) return '不错的成绩，错题记得回顾哦。'
  return '别灰心，把错题加入错题本多多练习吧。'
})

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}
</script>

<template>
  <div class="page flex flex-col min-h-screen bg-[#0B1120] text-[#E8EDF5]">
    <div class="relative py-12 px-5 text-center z-10 overflow-hidden flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
      <div class="absolute inset-0 bg-gradient-to-b from-teal-900/40 via-[#0B1120] to-[#0B1120] z-0"></div>

      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border border-teal-500/20 z-0 animate-spin-slow"></div>
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full border border-blue-500/10 z-0 animate-spin-slow" style="animation-direction: reverse;"></div>

      <div class="relative z-10 fade-up">
        <h2 class="text-2xl font-black mb-2 tracking-tight drop-shadow-md">{{ report ? '测评完成' : '答题完成' }}</h2>
        <p class="text-[#94A3B8] font-medium mb-10">{{ r?.bankName || '综合练习' }} · {{ report ? '测评报告' : r?.mode === 'exam' ? '模拟考试' : '自由练习' }}</p>

        <div class="ring-progress w-48 h-48 mx-auto mb-6 relative">
          <svg class="w-full h-full drop-shadow-[0_0_20px_rgba(20,184,166,0.5)]" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#162032" stroke-width="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              :stroke="isIq ? report.tierColor : 'url(#grad)'" stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="339.292"
              :stroke-dashoffset="339.292 * (1 - ringPct/100)"
              class="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0D9488" />
                <stop offset="100%" stop-color="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
          <div class="ring-text absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-300 to-blue-500 drop-shadow-sm"
              :class="isMbti ? 'text-3xl tracking-wider' : 'text-5xl'">{{ centerText }}</span>
            <span class="text-xs font-bold text-[#64748B] mt-1 tracking-widest">{{ centerLabel }}</span>
          </div>
        </div>

        <p class="text-sm text-[#94A3B8] mb-8 px-4 leading-relaxed">{{ comment }}</p>

        <!-- 测评报告：正确/错误卡片仅对有对错概念的测试展示 -->
        <div v-if="!isMbti" class="grid grid-cols-3 gap-4 mb-10">
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5 hover:-translate-y-1 transition-transform">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="fas fa-check text-green-400"></i> 正确</p>
            <p class="text-2xl font-bold text-green-400">{{ r?.correct }}</p>
          </div>
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5 hover:-translate-y-1 transition-transform" style="transition-delay: 50ms">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="fas fa-times text-red-400"></i> 错误</p>
            <p class="text-2xl font-bold text-red-400">{{ r?.wrong }}</p>
          </div>
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5 hover:-translate-y-1 transition-transform" style="transition-delay: 100ms">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="far fa-clock text-blue-400"></i> 用时</p>
            <p class="text-lg font-bold text-blue-400 mt-1">{{ formatTime(r?.elapsed || 0) }}</p>
          </div>
        </div>
        <div v-else class="grid grid-cols-2 gap-4 mb-10">
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="fas fa-list-ol text-purple-400"></i> 题目数</p>
            <p class="text-2xl font-bold text-purple-400">{{ r?.total }}</p>
          </div>
          <div class="g-card p-4 bg-[#162032]/80 backdrop-blur border-t border-white/5" style="transition-delay: 50ms">
            <p class="text-xs text-[#94A3B8] mb-2 font-medium"><i class="far fa-clock text-blue-400"></i> 用时</p>
            <p class="text-lg font-bold text-blue-400 mt-1">{{ formatTime(r?.elapsed || 0) }}</p>
          </div>
        </div>
      </div>

      <!-- MBTI 报告 -->
      <div v-if="isMbti" class="relative z-10 fade-up space-y-4 px-1 text-left">
        <div class="g-card p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <i class="fas fa-theater-masks text-white text-xl"></i>
            </div>
            <div>
              <h3 class="text-xl font-black">{{ report.typeName }} <span class="text-[#94A3B8] text-sm font-mono">{{ report.typeCode }}</span></h3>
              <p class="text-xs text-[#94A3B8] mt-0.5">{{ report.tagline }}</p>
            </div>
          </div>

          <div class="space-y-3 mb-5">
            <div v-for="d in report.dims" :key="d.dim">
              <div class="flex justify-between text-xs font-bold mb-1">
                <span class="text-teal-400">{{ d.left }} {{ d.leftPct }}%</span>
                <span class="text-[#64748B]">{{ d.label }}</span>
                <span class="text-blue-400">{{ d.rightPct }}% {{ d.right }}</span>
              </div>
              <div class="flex h-2 rounded-full overflow-hidden bg-[#0B1120]">
                <div class="bg-gradient-to-r from-teal-500 to-teal-400" :style="{ width: d.leftPct + '%' }"></div>
                <div class="bg-gradient-to-r from-blue-500 to-blue-400 flex-1"></div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-5">
            <span v-for="t in report.traits" :key="t" class="g-tag bg-purple-500/20 text-purple-300 text-xs px-2.5 py-1">{{ t }}</span>
          </div>

          <div class="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p class="font-bold text-emerald-400 mb-1.5 text-xs"><i class="fas fa-thumbs-up mr-1"></i>优势</p>
              <ul class="space-y-1 text-[#94A3B8] text-xs leading-relaxed">
                <li v-for="s in report.strengths" :key="s" class="flex gap-1.5"><span class="text-emerald-500">·</span>{{ s }}</li>
              </ul>
            </div>
            <div>
              <p class="font-bold text-orange-400 mb-1.5 text-xs"><i class="fas fa-exclamation-triangle mr-1"></i>盲点</p>
              <ul class="space-y-1 text-[#94A3B8] text-xs leading-relaxed">
                <li v-for="w in report.weaknesses" :key="w" class="flex gap-1.5"><span class="text-orange-500">·</span>{{ w }}</li>
              </ul>
            </div>
            <div>
              <p class="font-bold text-blue-400 mb-1.5 text-xs"><i class="fas fa-briefcase mr-1"></i>适合的发展方向</p>
              <p class="text-[#94A3B8] text-xs leading-relaxed">{{ report.careers.join(' · ') }}</p>
            </div>
            <div>
              <p class="font-bold text-pink-400 mb-1.5 text-xs"><i class="fas fa-heart mr-1"></i>高契合类型</p>
              <p class="text-[#94A3B8] text-xs leading-relaxed">{{ report.compatible.join(' · ') }}</p>
            </div>
          </div>
        </div>
        <div class="g-card p-4 text-xs text-[#64748B] leading-relaxed">
          <i class="fas fa-info-circle text-[#14B8A6] mr-1"></i>{{ report.note }}
        </div>
      </div>

      <!-- IQ 报告 -->
      <div v-else-if="isIq" class="relative z-10 fade-up space-y-4 px-1 text-left">
        <div class="g-card p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-xl font-black" :style="{ color: report.tierColor }">{{ report.tier }}</h3>
              <p class="text-xs text-[#94A3B8] mt-0.5">{{ report.percentile }}</p>
            </div>
            <i class="fas fa-brain text-3xl" :style="{ color: report.tierColor }"></i>
          </div>

          <p class="text-xs font-bold text-[#94A3B8] mb-3"><i class="fas fa-chart-bar text-[#14B8A6] mr-1"></i>能力维度分析</p>
          <div class="space-y-3 mb-5">
            <div v-for="c in report.byCat" :key="c.cat">
              <div class="flex justify-between text-xs font-bold mb-1">
                <span>{{ c.cat }}</span>
                <span :class="c.pct >= 80 ? 'text-emerald-400' : c.pct >= 50 ? 'text-blue-400' : 'text-orange-400'">
                  {{ c.correct }}/{{ c.total }} · {{ c.pct }}%
                </span>
              </div>
              <div class="progress-bar bg-[#0B1120]">
                <div class="progress-fill" :style="{ width: c.pct + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-[#0B1120]/60 rounded-xl p-3 border border-[#243049]">
              <p class="text-emerald-400 font-bold mb-0.5"><i class="fas fa-trophy mr-1"></i>最强维度</p>
              <p class="text-[#94A3B8]">{{ report.bestCat }}</p>
            </div>
            <div class="bg-[#0B1120]/60 rounded-xl p-3 border border-[#243049]">
              <p class="text-orange-400 font-bold mb-0.5"><i class="fas fa-dumbbell mr-1"></i>可提升</p>
              <p class="text-[#94A3B8]">{{ report.worstCat }}</p>
            </div>
          </div>
        </div>
        <div class="g-card p-4 text-xs text-[#64748B] leading-relaxed">
          <i class="fas fa-info-circle text-[#14B8A6] mr-1"></i>
          本测试为娱乐与自我认知参考，不构成临床或专业鉴定。分数受状态、环境与题目熟悉度影响，建议休息充分后多次测试取参考。
        </div>
      </div>

      <div class="flex gap-4 relative z-10 fade-up px-5 mt-8" style="animation-delay: 0.2s">
        <button class="g-btn g-btn-ghost flex-1 bg-[#162032] border-[#243049] hover:bg-[#1C2942] hover:text-white" @click="router.replace(`/bank/${r?.bankId || ''}`)">
          返回题库
        </button>
        <button v-if="!report" class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)]" @click="router.replace('/wrong')">
          查看错题 <i class="fas fa-arrow-right text-sm ml-1"></i>
        </button>
        <button v-else class="g-btn g-btn-primary flex-1 shadow-[0_8px_25px_rgba(13,148,136,0.4)]" @click="router.replace('/')">
          返回首页 <i class="fas fa-arrow-right text-sm ml-1"></i>
        </button>
      </div>
    </div>
  </div>
</template>
