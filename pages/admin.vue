<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const router = useRouter()
const { $toast, $api } = useNuxtApp()

if (!appStore.user?.isAdmin) {
  router.replace('/')
}

const banks = ref<any[]>([])
const loading = ref(true)

const loadBanks = async () => {
  try {
    banks.value = await $api<any[]>('/api/admin/banks')
  } catch {
    $toast.error('加载题库失败')
  } finally {
    loading.value = false
  }
}
onMounted(loadBanks)

// 新建题库
const showCreate = ref(false)
const newBank = ref({ id: '', name: '', type: 'exam', typeName: '考试类', difficulty: '中等', description: '' })
const createBank = async () => {
  try {
    await $api('/api/admin/banks', { method: 'POST', body: newBank.value })
    $toast.success('题库已创建')
    showCreate.value = false
    newBank.value = { id: '', name: '', type: 'exam', typeName: '考试类', difficulty: '中等', description: '' }
    await loadBanks()
  } catch (e: any) {
    $toast.error(e?.data?.message || '创建失败')
  }
}

const deleteBank = async (b: any) => {
  if (!confirm(`确定删除题库「${b.name}」？其下所有题目将一并删除。`)) return
  try {
    await $api(`/api/admin/banks/${b.id}`, { method: 'DELETE' })
    $toast.success('已删除')
    await loadBanks()
  } catch {
    $toast.error('删除失败')
  }
}

// 题目管理
const manageBank = ref<any>(null)
const questions = ref<any[]>([])
const loadingQuestions = ref(false)

const openManage = async (b: any) => {
  manageBank.value = b
  loadingQuestions.value = true
  try {
    const detail = await $api<any>(`/api/banks/${b.id}`)
    questions.value = detail.questions || []
  } catch {
    $toast.error('加载题目失败')
  } finally {
    loadingQuestions.value = false
  }
}

const typeName = (t: string) => ({ single: '单选', judge: '判断', multi: '多选' })[t] || '单选'

const deleteQuestion = async (qid: number) => {
  if (!confirm('确定删除该题目？')) return
  try {
    await $api(`/api/admin/questions/${qid}`, { method: 'DELETE' })
    questions.value = questions.value.filter(q => q.id !== qid)
    if (manageBank.value) manageBank.value.question_count = questions.value.length
    $toast.success('已删除')
  } catch {
    $toast.error('删除失败')
  }
}

// 新增题目
const showAddQuestion = ref(false)
const newQuestion = ref<{ type: 'single' | 'judge' | 'multi'; content: string; opts: string[]; ansSet: number[]; explanation: string }>({
  type: 'single', content: '', opts: ['', '', '', ''], ansSet: [], explanation: ''
})

const resetQuestionForm = () => {
  newQuestion.value = { type: 'single', content: '', opts: ['', '', '', ''], ansSet: [], explanation: '' }
}

const onTypeChange = () => {
  if (newQuestion.value.type === 'judge') {
    newQuestion.value.opts = ['正确', '错误']
  } else if (newQuestion.value.opts.length === 2 && newQuestion.value.opts[0] === '正确') {
    newQuestion.value.opts = ['', '', '', '']
  }
  newQuestion.value.ansSet = []
}

const setType = (t: string) => {
  newQuestion.value.type = t as 'single' | 'judge' | 'multi'
  onTypeChange()
}

const toggleAns = (i: number) => {
  const nq = newQuestion.value
  if (nq.type === 'multi') {
    const pos = nq.ansSet.indexOf(i)
    if (pos > -1) nq.ansSet.splice(pos, 1)
    else nq.ansSet.push(i)
  } else {
    nq.ansSet = [i]
  }
}

const saveQuestion = async () => {
  const nq = newQuestion.value
  if (!nq.content.trim()) { $toast.warning('请输入题干'); return }
  if (nq.opts.filter(o => o.trim()).length < 2) { $toast.warning('至少两个选项'); return }
  if (!nq.ansSet.length) { $toast.warning('请选择正确答案'); return }
  try {
    await $api(`/api/admin/banks/${manageBank.value.id}/questions`, {
      method: 'POST',
      body: { type: nq.type, content: nq.content, opts: nq.opts.filter(o => o.trim()), ans: nq.type === 'multi' ? nq.ansSet : nq.ansSet[0], explanation: nq.explanation }
    })
    $toast.success('题目已添加')
    showAddQuestion.value = false
    resetQuestionForm()
    await openManage(manageBank.value)
    await loadBanks()
  } catch (e: any) {
    $toast.error(e?.data?.message || '添加失败')
  }
}
</script>

<template>
  <div class="p-5 pb-24 max-w-lg mx-auto">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-6 page-header py-4 -mx-5 px-5 bg-opacity-90 z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#162032] flex items-center justify-center text-[#E8EDF5] cursor-pointer hover:bg-[#1C2942] transition-colors" @click="router.push('/profile')">
          <i class="fas fa-arrow-left"></i>
        </div>
        <h1 class="text-xl font-bold tracking-tight">题库管理</h1>
      </div>
      <button class="text-sm font-bold text-teal-400 hover:text-teal-300" @click="showCreate = true">
        <i class="fas fa-plus mr-1"></i>新建
      </button>
    </div>

    <div v-if="loading" class="text-center py-20 text-[#94A3B8]">
      <i class="fas fa-spinner fa-spin text-2xl"></i>
    </div>

    <!-- 题库列表 -->
    <div v-else class="space-y-3">
      <div v-for="b in banks" :key="b.id" class="g-card p-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" :style="{ background: (b.color || '#3B82F6') + '22' }">
            <i :class="b.icon || 'fas fa-book'" :style="{ color: b.color || '#3B82F6' }"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold truncate">{{ b.name }}</h3>
            <p class="text-xs text-[#64748B]">{{ b.type_name || b.type }} · {{ b.difficulty }} · <span class="text-teal-400 font-bold">{{ b.question_count }}</span> 题</p>
          </div>
          <button class="w-9 h-9 rounded-lg bg-[#162032] flex items-center justify-center text-[#94A3B8] hover:bg-teal-500/20 hover:text-teal-400 transition-colors" title="管理题目" @click="openManage(b)">
            <i class="fas fa-list-check text-sm"></i>
          </button>
          <button class="w-9 h-9 rounded-lg bg-[#162032] flex items-center justify-center text-[#94A3B8] hover:bg-red-500/20 hover:text-red-400 transition-colors" title="删除题库" @click="deleteBank(b)">
            <i class="fas fa-trash-alt text-sm"></i>
          </button>
        </div>
      </div>
      <div v-if="banks.length === 0" class="text-center py-16 text-[#64748B]">暂无题库</div>
    </div>

    <!-- 新建题库弹层 -->
    <div v-if="showCreate" class="modal-overlay z-50" @click.self="showCreate = false">
      <div class="modal-content">
        <h3 class="text-lg font-bold mb-6">新建题库</h3>
        <div class="space-y-4">
          <input v-model="newBank.id" class="g-input" placeholder="题库 ID（小写字母/数字，如 vue3）">
          <input v-model="newBank.name" class="g-input" placeholder="题库名称">
          <div class="grid grid-cols-2 gap-3">
            <select v-model="newBank.type" class="g-input" @change="newBank.typeName = { exam: '考试类', skill: '技能类', license: '资格类', language: '语言类', interest: '兴趣类' }[newBank.type] || '考试类'">
              <option value="exam">考试类</option>
              <option value="skill">技能类</option>
              <option value="license">资格类</option>
              <option value="language">语言类</option>
              <option value="interest">兴趣类</option>
            </select>
            <select v-model="newBank.difficulty" class="g-input">
              <option>简单</option>
              <option>中等</option>
              <option>困难</option>
            </select>
          </div>
          <textarea v-model="newBank.description" class="g-input h-20 py-3" placeholder="题库简介"></textarea>
          <div class="flex gap-3">
            <button class="g-btn g-btn-ghost flex-1 bg-[#162032] border-[#243049]" @click="showCreate = false">取消</button>
            <button class="g-btn g-btn-primary flex-1" @click="createBank">创建</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 题目管理弹层 -->
    <div v-if="manageBank" class="modal-overlay z-50" @click.self="manageBank = null">
      <div class="modal-content max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">{{ manageBank.name }} · 题目管理</h3>
          <button class="text-sm font-bold text-teal-400" @click="showAddQuestion = true">
            <i class="fas fa-plus mr-1"></i>加题
          </button>
        </div>

        <div v-if="loadingQuestions" class="text-center py-10 text-[#94A3B8]">
          <i class="fas fa-spinner fa-spin text-xl"></i>
        </div>
        <div v-else class="space-y-2">
          <div v-for="(q, i) in questions" :key="q.id" class="bg-[#0B1120]/60 border border-[#243049] rounded-xl p-3 flex items-start gap-2">
            <span class="text-xs text-[#64748B] font-bold mt-0.5 w-5 shrink-0">{{ i + 1 }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium line-clamp-2">{{ q.q }}</p>
              <p class="text-[10px] text-[#64748B] mt-1">
                {{ typeName(q.type) }} · 正确答案：
                <span class="text-teal-400 font-bold">{{ Array.isArray(q.ans) ? q.ans.map((a: number) => String.fromCharCode(65 + a)).join('、') : String.fromCharCode(65 + q.ans) }}</span>
              </p>
            </div>
            <button class="w-8 h-8 rounded-lg bg-[#162032] flex items-center justify-center text-[#64748B] hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0" @click="deleteQuestion(q.id)">
              <i class="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
          <div v-if="questions.length === 0" class="text-center py-8 text-sm text-[#64748B]">暂无题目，点击右上角「加题」</div>
        </div>
      </div>
    </div>

    <!-- 新增题目弹层 -->
    <div v-if="showAddQuestion" class="modal-overlay z-[60]" @click.self="showAddQuestion = false">
      <div class="modal-content max-h-[85vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">添加题目</h3>
        <div class="space-y-4">
          <div class="flex gap-2">
            <button v-for="t in ['single', 'judge', 'multi']" :key="t" class="g-tag cursor-pointer border-none px-3 py-1.5"
              :class="newQuestion.type === t ? 'bg-[var(--accent)] text-white' : 'bg-[var(--card)] text-[var(--fg2)]'"
              @click="setType(t)">{{ typeName(t) }}</button>
          </div>
          <textarea v-model="newQuestion.content" class="g-input h-20 py-3" placeholder="题干内容"></textarea>
          <div class="space-y-2">
            <div v-for="(_, i) in newQuestion.opts" :key="i" class="flex items-center gap-2">
              <button class="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border transition-colors"
                :class="newQuestion.ansSet.includes(i) ? 'bg-teal-500 border-teal-500 text-white' : 'bg-[#162032] border-[#243049] text-[#64748B]'"
                :title="newQuestion.ansSet.includes(i) ? '正确答案' : '设为正确答案'"
                @click="toggleAns(i)">{{ String.fromCharCode(65 + i) }}</button>
              <input v-model="newQuestion.opts[i]" class="g-input flex-1" :placeholder="`选项 ${String.fromCharCode(65 + i)}`" :disabled="newQuestion.type === 'judge'">
            </div>
          </div>
          <textarea v-model="newQuestion.explanation" class="g-input h-16 py-3" placeholder="答案解析（选填）"></textarea>
          <div class="flex gap-3">
            <button class="g-btn g-btn-ghost flex-1 bg-[#162032] border-[#243049]" @click="showAddQuestion = false; resetQuestionForm()">取消</button>
            <button class="g-btn g-btn-primary flex-1" @click="saveQuestion">保存题目</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
