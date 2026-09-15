<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

const loading = ref(true)
const stats = ref<any>({
  totalAnswered: 0,
  totalCorrect: 0,
  accuracy: 0,
  streak: 0,
  week: [],
  byType: [],
  timeDistribution: { morning: 0, noon: 0, evening: 0 }
})

onMounted(async () => {
  try {
    stats.value = await $api<any>('/api/stats')
  } catch {
    $toast.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
})

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const weekData = computed(() => stats.value.week || [])
const maxWeek = computed(() => Math.max(1, ...weekData.value.map((w: any) => w.total)))

const getBarHeight = (val: number) => {
  return (val / maxWeek.value) * 100
}

const dateLabel = (d: string) => {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dayNames[dt.getDay()]
}

const totalDist = computed(() => {
  const d = stats.value.timeDistribution || { morning: 0, noon: 0, evening: 0 }
  return d.morning + d.noon + d.evening
})
const distPct = (v: number) => totalDist.value ? Math.round((v / totalDist.value) * 100) : 0
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 头部区域 -->
    <div class="flex items-center justify-between mb-6 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/profile')">
          <i class="fas fa-arrow-left"></i>
        </div>
        <h1 class="text-xl font-bold tracking-tight">数据分析</h1>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20 text-[#94A3B8]">
      <i class="fas fa-spinner fa-spin text-2xl"></i>
    </div>

    <template v-else>
      <!-- 核心指标 -->
      <div class="grid grid-cols-2 gap-4 mb-8 fade-up">
        <div class="g-card p-5 relative overflow-hidden bg-gradient-to-br from-[#1C2942] to-[#162032] border-[#243049]">
          <div class="absolute -right-4 -bottom-4 opacity-10">
            <i class="fas fa-bullseye text-6xl text-teal-400"></i>
          </div>
          <div class="text-xs font-medium text-[#94A3B8] mb-2 flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-teal-400"></div> 正确率</div>
          <p class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-300 to-blue-500">{{ stats.accuracy }}<span class="text-sm text-[#64748B] font-bold">%</span></p>
        </div>
        <div class="g-card p-5 relative overflow-hidden bg-gradient-to-br from-[#1C2942] to-[#162032] border-[#243049]">
          <div class="absolute -right-4 -bottom-4 opacity-10">
            <i class="fas fa-fire text-6xl text-orange-400"></i>
          </div>
          <div class="text-xs font-medium text-[#94A3B8] mb-2 flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-orange-400"></div> 连续打卡</div>
          <p class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-500">{{ stats.streak }}<span class="text-sm text-[#64748B] font-bold">天</span></p>
        </div>
      </div>

      <!-- 学习趋势图表 -->
      <div class="g-card p-6 mb-8 fade-up" style="animation-delay:0.1s">
        <h3 class="text-base font-bold mb-6 flex items-center gap-2">
          <i class="fas fa-chart-line text-[#14B8A6]"></i> 近7天学习趋势
        </h3>
        <div class="h-40 flex items-end justify-between gap-2 border-b border-[#243049] pb-2">
          <div v-for="(w, i) in weekData" :key="i" class="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div class="absolute -top-8 bg-[#162032] text-xs font-bold px-2 py-1 rounded border border-[#243049] opacity-0 group-hover:opacity-100 transition-opacity z-10">{{ w.total }}题</div>
            <div class="w-full max-w-[24px] stat-bar bg-gradient-to-t from-teal-600/50 to-teal-400 transition-all duration-500" :style="{ height: `${getBarHeight(w.total)}%` }"></div>
          </div>
        </div>
        <div class="flex justify-between mt-3 text-[10px] text-[#64748B] font-medium">
          <span v-for="(w, i) in weekData" :key="i">{{ dateLabel(w.date) }}</span>
        </div>
      </div>

      <!-- 科目正确率 -->
      <div class="g-card p-6 mb-8 fade-up" style="animation-delay:0.15s">
        <h3 class="text-base font-bold mb-6 flex items-center gap-2">
          <i class="fas fa-layer-group text-[#14B8A6]"></i> 各科目正确率
        </h3>
        <div v-if="stats.byType.length === 0" class="text-center text-sm text-[#64748B] py-4">暂无答题数据</div>
        <div class="space-y-4">
          <div v-for="t in stats.byType" :key="t.type">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span>{{ t.typeName }}</span>
              <span class="text-teal-400">{{ t.accuracy }}%</span>
            </div>
            <div class="progress-bar bg-[#0B1120]"><div class="progress-fill" :style="{ width: `${t.accuracy}%` }"></div></div>
          </div>
        </div>
      </div>

      <!-- 答题时段分布 -->
      <div class="g-card p-6 fade-up" style="animation-delay:0.2s">
        <h3 class="text-base font-bold mb-6 flex items-center gap-2">
          <i class="fas fa-clock text-[#14B8A6]"></i> 答题时段分布
        </h3>
        <div v-if="totalDist === 0" class="text-center text-sm text-[#64748B] py-4">暂无答题数据</div>
        <div v-else class="space-y-4">
          <div v-for="seg in [
            { key: 'morning', name: '早晨 (5:00-12:00)', icon: 'fa-sun', color: '#FBBF24' },
            { key: 'noon', name: '午后 (12:00-18:00)', icon: 'fa-cloud-sun', color: '#60A5FA' },
            { key: 'evening', name: '夜晚 (18:00-5:00)', icon: 'fa-moon', color: '#A78BFA' }
          ]" :key="seg.key">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span class="flex items-center gap-1.5"><i class="fas" :class="seg.icon" :style="{ color: seg.color }"></i> {{ seg.name }}</span>
              <span :style="{ color: seg.color }">{{ distPct(stats.timeDistribution[seg.key]) }}%</span>
            </div>
            <div class="progress-bar bg-[#0B1120]">
              <div class="progress-fill" :style="{ width: `${distPct(stats.timeDistribution[seg.key])}%`, background: `linear-gradient(90deg, ${seg.color}88, ${seg.color})` }"></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
