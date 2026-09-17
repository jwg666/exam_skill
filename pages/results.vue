<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

const reports = ref<any[]>([])
const banks = ref<any[]>([])
const ranking = ref<any>({ list: [], myRank: 0 })
const loading = ref(true)
const expandedId = ref<number | null>(null)

onMounted(async () => {
  appStore.fetchAll()
  try {
    const [reps, bankList, rank] = await Promise.all([
      $api<any[]>('/api/assessment-reports'),
      $api<any[]>('/api/banks'),
      $api<any>('/api/ranking')
    ])
    reports.value = reps
    banks.value = bankList
    ranking.value = rank
  } catch (e) {
    $toast.error('加载成果数据失败')
  } finally {
    loading.value = false
  }
})

const hotBanks = computed(() => banks.value.slice(0, 2))

const toggle = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}

const keyResult = (r: any) => {
  if (r.report.kind === 'mbti') return r.report.typeCode
  return String(r.report.iq)
}
const keyLabel = (r: any) => {
  if (r.report.kind === 'mbti') return r.report.typeName
  return 'IQ · ' + r.report.tier
}
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <div class="page-header px-5 py-4 -mx-5">
      <h1 class="text-[22px] font-black">成果</h1>
    </div>

    <div v-if="loading" class="text-center py-20 text-[#94A3B8]">
      <i class="fas fa-spinner fa-spin text-2xl"></i>
    </div>

    <template v-else>
      <!-- 测评报告 -->
      <div class="mb-8 fade-up">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">测评报告</h3>
          <span class="text-sm text-[#64748B]">{{ reports.length }} 份</span>
        </div>

        <div v-if="reports.length === 0" class="g-card p-8 text-center">
          <div class="w-20 h-20 rounded-full bg-[#162032] flex items-center justify-center mx-auto mb-4 border border-[#243049]/50">
            <i class="fas fa-medal text-3xl text-[#64748B]"></i>
          </div>
          <p class="text-[#94A3B8] font-medium mb-1">还没有测评报告</p>
          <p class="text-xs text-[#64748B] mb-5">完成 16 型人格或智商测试后，报告会保存在这里</p>
          <button class="g-btn g-btn-primary px-6 py-2" @click="router.push('/bank')">
            去测评 <i class="fas fa-arrow-right text-xs ml-1"></i>
          </button>
        </div>

        <div v-else class="space-y-3">
          <div v-for="r in reports" :key="r.id" class="g-card p-4 cursor-pointer hover:border-[#14B8A6]/50 transition-colors" @click="toggle(r.id)">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" :style="{ background: (r.color || '#3B82F6') + '22' }">
                <i :class="[r.icon || 'fas fa-book', 'text-lg']" :style="{ color: r.color || '#3B82F6' }"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate">{{ r.bankName }}</p>
                <p class="text-[10px] text-[#64748B]">{{ r.date }} 完成</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-lg font-black" :class="r.report.kind === 'iq' ? '' : 'text-purple-400'" :style="r.report.kind === 'iq' ? { color: r.report.tierColor } : {}">{{ keyResult(r) }}</p>
                <p class="text-[10px] text-[#64748B]">{{ keyLabel(r) }}</p>
              </div>
              <i class="fas fa-chevron-down text-xs text-[#64748B] transition-transform ml-1" :class="{ 'rotate-180': expandedId === r.id }"></i>
            </div>
            <div v-if="expandedId === r.id" class="mt-4 pt-4 border-t border-[#243049]" @click.stop>
              <ReportMbti v-if="r.report.kind === 'mbti'" :report="r.report" />
              <ReportIq v-else-if="r.report.kind === 'iq'" :report="r.report" />
            </div>
          </div>
        </div>
      </div>

      <!-- 最近学习 -->
      <div class="mb-8 fade-up" style="animation-delay:0.1s">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">最近学习</h3>
          <span class="text-sm text-[#64748B] hover:text-teal-400 cursor-pointer transition-colors" @click="router.push('/bank')">查看全部 <i class="fas fa-chevron-right text-[10px]"></i></span>
        </div>
        <div class="space-y-3">
          <BankCard v-for="bank in hotBanks" :key="bank.id" :bank="bank" :progress="appStore.bankProgress[bank.id] || 0" />
          <div v-if="hotBanks.length === 0" class="g-card p-6 text-center text-sm text-[#64748B]">还没有学习记录，去题库开始第一题吧</div>
        </div>
      </div>

      <!-- 学习排行榜 -->
      <div class="fade-up" style="animation-delay:0.2s">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">学习排行榜</h3>
          <span v-if="ranking.myRank" class="text-sm text-[#94A3B8]">我的排名 <span class="text-teal-400 font-bold">#{{ ranking.myRank }}</span></span>
        </div>
        <div class="g-card p-2 space-y-1">
          <div v-if="ranking.list.length === 0" class="text-center py-6 text-sm text-[#64748B]">暂无排行数据</div>
          <div v-for="(r, i) in ranking.list.slice(0, 5)" :key="r.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            :class="r.isMe ? 'bg-teal-500/10 border border-teal-500/30' : ''"
          >
            <span class="w-6 text-center text-sm font-black" :class="i === 0 ? 'text-amber-400' : i === 1 ? 'text-[#C0C0C0]' : i === 2 ? 'text-orange-400' : 'text-[#64748B]'">{{ i + 1 }}</span>
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C2942] to-[#162032] flex items-center justify-center text-xs font-bold text-[#94A3B8]">{{ r.name.slice(0, 1) }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate">{{ r.name }} <span v-if="r.isMe" class="text-teal-400 text-xs">(我)</span></p>
              <p class="text-[10px] text-[#64748B]">正确率 {{ r.accuracy }}% · 连续 {{ r.streak }} 天</p>
            </div>
            <span class="text-sm font-bold text-teal-400">{{ r.totalAnswered }} <span class="text-[10px] text-[#64748B] font-normal">题</span></span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
