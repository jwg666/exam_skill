<script setup lang="ts">
// 16 型人格报告展示（结果页与成果页共用）
defineProps<{ report: any }>()
</script>

<template>
  <div class="space-y-4">
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
</template>
