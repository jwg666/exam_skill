<script setup lang="ts">
// 智商测试报告展示（结果页与成果页共用）
defineProps<{ report: any }>()
</script>

<template>
  <div class="space-y-4">
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
</template>
