<template>
  <AppShell><div class="page-heading"><div><span class="eyebrow">{{ monthLabel.toUpperCase() }} · SEU RESUMO</span><h1>Seu dinheiro, em perspectiva<span class="heading-period">.</span></h1><p>Acompanhe sua movimentação e mantenha seus planos no caminho certo.</p></div><div class="heading-actions"><ion-button fill="outline" class="outline-action" @click="openModal('expense')"><ion-icon :icon="addOutline" slot="start"/> Nova despesa</ion-button><ion-button class="primary-action" @click="openModal('income')"><ion-icon :icon="addOutline" slot="start"/> Nova receita</ion-button></div></div>
    <div v-if="!hasSupabaseConfig" class="demo-notice"><ion-icon :icon="sparklesOutline"/><span>Você está explorando uma demonstração. Seus lançamentos ficam salvos neste navegador.</span></div>
    <div v-if="error" class="inline-error" role="alert">{{ error }}</div>
    <section class="summary-grid">
      <article class="summary-card"><div class="card-top"><span class="summary-label">Receitas do mês</span><span class="summary-icon income-icon"><ion-icon :icon="arrowDownOutline"/></span></div><strong class="summary-value">{{ money(monthIncome) }}</strong><div class="summary-foot"><span class="trend-up"><ion-icon :icon="trendingUpOutline"/> Entradas</span><span class="foot-muted">{{ countMonth(incomes) }} lançamento{{ countMonth(incomes) === 1 ? '' : 's' }}</span></div><div class="card-accent accent-green"></div></article>
      <article class="summary-card"><div class="card-top"><span class="summary-label">Despesas do mês</span><span class="summary-icon expense-icon"><ion-icon :icon="arrowUpOutline"/></span></div><strong class="summary-value">{{ money(monthExpense) }}</strong><div class="summary-foot"><span class="trend-down"><ion-icon :icon="trendingDownOutline"/> Saídas</span><span class="foot-muted">{{ countMonth(expenses) }} lançamento{{ countMonth(expenses) === 1 ? '' : 's' }}</span></div><div class="card-accent accent-orange"></div></article>
      <article class="summary-card balance-card"><div class="card-top"><span class="summary-label">Saldo disponível</span><span class="summary-icon balance-icon"><ion-icon :icon="walletOutline"/></span></div><strong class="summary-value">{{ money(monthIncome - monthExpense) }}</strong><div class="summary-foot"><span :class="monthIncome - monthExpense >= 0 ? 'trend-up' : 'trend-down'"><ion-icon :icon="pulseOutline"/> {{ monthIncome - monthExpense >= 0 ? 'Saldo positivo' : 'Saldo negativo' }}</span><span class="foot-muted">Neste mês</span></div><div class="card-accent accent-blue"></div></article>
      <article class="summary-card"><div class="card-top"><span class="summary-label">Comprometimento</span><span class="summary-icon ratio-icon"><ion-icon :icon="pieChartOutline"/></span></div><strong class="summary-value">{{ expenseRatio }}<small>%</small></strong><div class="ratio-track"><span :style="{ width: `${Math.min(expenseRatio, 100)}%` }"></span></div><div class="summary-foot"><span class="foot-muted">Despesas sobre receitas</span></div><div class="card-accent accent-violet"></div></article>
    </section>
    <section class="charts-grid"><article class="panel chart-panel"><div class="panel-heading"><div><h2>Despesas por categoria</h2><p>Onde seu dinheiro está indo</p></div><span class="period-pill">Este mês</span></div><div v-if="categoryLabels.length" class="chart-body donut-wrap"><VueApexCharts type="donut" height="255" :options="donutOptions" :series="categoryValues"/><div class="donut-center"><span>Total de despesas</span><strong>{{ money(monthExpense) }}</strong></div></div><div v-else class="empty-chart">Sem despesas registradas neste mês.</div><div class="legend-list"><div v-for="(label, index) in categoryLabels" :key="label" class="legend-row"><span class="legend-name"><i :style="{ background: chartColors[index % chartColors.length] }"></i>{{ label }}</span><strong>{{ money(categoryValues[index]) }}</strong></div></div></article>
      <article class="panel chart-panel"><div class="panel-heading"><div><h2>Fluxo financeiro</h2><p>Receitas e despesas nos últimos 6 meses</p></div><span class="chart-legend"><i class="income-dot"></i> Receitas <i class="expense-dot"></i> Despesas</span></div><div class="chart-body"><VueApexCharts type="bar" height="300" :options="barOptions" :series="barSeries"/></div><div class="chart-caption"><span><i class="income-dot"></i> Receitas</span><span><i class="expense-dot"></i> Despesas</span><span>Valores em R$</span></div></article></section>
    <section class="panel activity-panel"><div class="panel-heading activity-heading"><div><h2>Movimentações recentes</h2><p>Suas últimas receitas e despesas</p></div><router-link to="/despesas" class="view-all">Ver lançamentos <ion-icon :icon="arrowForwardOutline"/></router-link></div><div v-if="recent.length" class="activity-list"><div v-for="item in recent" :key="`${item.kind}-${item.id}`" class="activity-row"><span class="activity-type" :class="item.kind"><ion-icon :icon="item.kind === 'income' ? arrowDownOutline : arrowUpOutline"/></span><div class="activity-description"><strong>{{ item.description }}</strong><span>{{ item.category }} · {{ formatDate(item.date) }}</span></div><strong class="activity-amount" :class="item.kind">{{ item.kind === 'income' ? '+' : '−' }} {{ money(item.amount) }}</strong></div></div><div v-else class="empty-state">Ainda não há movimentações neste mês. Adicione sua primeira receita ou despesa.</div></section>
    <TransactionModal :open="modalOpen" :kind="modalKind" :saving="saving" @close="modalOpen = false" @save="save"/>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { IonButton, IonIcon, toastController } from '@ionic/vue'
import VueApexCharts from 'vue3-apexcharts'
import { addOutline, arrowDownOutline, arrowUpOutline, arrowForwardOutline, trendingUpOutline, trendingDownOutline, walletOutline, pulseOutline, pieChartOutline, sparklesOutline } from 'ionicons/icons'
import AppShell from '../components/AppShell.vue'
import TransactionModal from '../components/TransactionModal.vue'
import { listTransactions, saveTransaction } from '../services/transactions'
import { hasSupabaseConfig } from '../services/supabase'

const incomes = ref([]), expenses = ref([]), error = ref(''), modalOpen = ref(false), modalKind = ref('income'), saving = ref(false)
const now = new Date(), monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)
const thisMonth = (rows) => rows.filter((item) => item.date?.startsWith(monthKey))
const monthIncome = computed(() => thisMonth(incomes.value).reduce((sum, item) => sum + item.amount, 0))
const monthExpense = computed(() => thisMonth(expenses.value).reduce((sum, item) => sum + item.amount, 0))
const expenseRatio = computed(() => monthIncome.value ? Math.round(monthExpense.value / monthIncome.value * 100) : 0)
const countMonth = (rows) => thisMonth(rows).length
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '')
const recent = computed(() => [...incomes.value, ...expenses.value].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5))
const categoryTotals = computed(() => thisMonth(expenses.value).reduce((map, item) => { map.set(item.category, (map.get(item.category) || 0) + item.amount); return map }, new Map()))
const chartColors = ['#76d8ad', '#8b9dff', '#f7b66b', '#e78698', '#73c9d1', '#be9bef', '#d9d7ce']
const categoryLabels = computed(() => [...categoryTotals.value.keys()])
const categoryValues = computed(() => [...categoryTotals.value.values()])
const donutOptions = computed(() => ({ chart: { background: 'transparent', fontFamily: 'Inter, sans-serif' }, labels: categoryLabels.value, colors: chartColors, stroke: { width: 4, colors: ['#171c1a'] }, dataLabels: { enabled: false }, legend: { show: false }, plotOptions: { pie: { donut: { size: '78%' } } }, tooltip: { y: { formatter: (value) => money(value) } }, states: { hover: { filter: { type: 'lighten', value: 0.05 } } } }))
const monthKeys = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
const monthNames = monthKeys.map((key) => new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${key}-15T12:00:00`)).replace('.', ''))
function sumForMonth(rows, key) { return rows.filter((item) => item.date?.startsWith(key)).reduce((sum, item) => sum + item.amount, 0) }
const barSeries = computed(() => [{ name: 'Receitas', data: monthKeys.map((key) => sumForMonth(incomes.value, key)) }, { name: 'Despesas', data: monthKeys.map((key) => sumForMonth(expenses.value, key)) }])
const barOptions = { chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif' }, colors: ['#76d8ad', '#f7b66b'], plotOptions: { bar: { borderRadius: 5, columnWidth: '42%' } }, dataLabels: { enabled: false }, xaxis: { categories: monthNames, labels: { style: { colors: '#777f7b' } }, axisBorder: { show: false }, axisTicks: { show: false } }, yaxis: { labels: { style: { colors: '#777f7b' }, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}` } }, grid: { borderColor: '#2a302d', strokeDashArray: 4 }, legend: { show: false }, tooltip: { y: { formatter: (v) => money(v) } }, states: { hover: { filter: { type: 'lighten', value: 0.05 } } } }
async function load() { error.value = ''; try { [incomes.value, expenses.value] = await Promise.all([listTransactions('income'), listTransactions('expense')]) } catch (e) { error.value = e.message || 'Não foi possível carregar seus lançamentos.' } }
function openModal(kind) { modalKind.value = kind; modalOpen.value = true }
async function save(item) { saving.value = true; try { await saveTransaction(item.kind, item); modalOpen.value = false; await load(); const toast = await toastController.create({ message: 'Lançamento salvo com sucesso.', duration: 2000, color: 'success' }); await toast.present() } catch (e) { error.value = e.message || 'Não foi possível salvar o lançamento.' } finally { saving.value = false } }
onMounted(load)
</script>
