<template>
  <AppShell><div class="page-heading"><div><span class="eyebrow">ORGANIZE SUAS MOVIMENTAÇÕES</span><h1>{{ isIncome ? 'Receitas' : 'Despesas' }}<span class="heading-period">.</span></h1><p>{{ isIncome ? 'Acompanhe tudo o que entra na sua conta.' : 'Entenda e organize tudo o que sai da sua conta.' }}</p></div><div class="heading-actions"><ion-button class="primary-action" @click="openNew"><ion-icon :icon="addOutline" slot="start"/> Nova {{ isIncome ? 'receita' : 'despesa' }}</ion-button></div></div>
    <div v-if="!hasSupabaseConfig" class="demo-notice"><ion-icon :icon="sparklesOutline"/><span>Modo demonstração: lançamentos salvos apenas neste navegador.</span></div><div v-if="error" class="inline-error" role="alert">{{ error }}</div>
    <section class="panel transactions-panel"><div class="transactions-toolbar"><div class="search-wrap"><ion-icon :icon="searchOutline"/><ion-input v-model="search" placeholder="Buscar por descrição ou categoria" aria-label="Buscar lançamentos"/></div><div class="filter-wrap"><ion-icon :icon="calendarOutline"/><ion-select v-model="period" interface="popover" aria-label="Filtrar período"><ion-select-option value="all">Todo o período</ion-select-option><ion-select-option value="month">Este mês</ion-select-option><ion-select-option value="lastMonth">Mês anterior</ion-select-option><ion-select-option value="year">Este ano</ion-select-option></ion-select></div></div>
      <div v-if="filtered.length" class="transaction-table"><div class="table-head"><span>DESCRIÇÃO</span><span>CATEGORIA</span><span>DATA</span><span>VALOR</span><span></span></div><div v-for="item in filtered" :key="item.id" class="transaction-row"><div class="transaction-title"><span class="activity-type" :class="kind"><ion-icon :icon="kind === 'income' ? arrowDownOutline : arrowUpOutline"/></span><div><strong>{{ item.description }}</strong><small>{{ isIncome ? 'Receita' : 'Despesa' }}</small></div></div><span class="category-pill">{{ item.category }}</span><span class="date-cell">{{ formatDate(item.date) }}</span><strong class="table-amount" :class="kind">{{ kind === 'income' ? '+' : '−' }} {{ money(item.amount) }}</strong><div class="row-actions"><ion-button fill="clear" aria-label="Editar lançamento" @click="edit(item)"><ion-icon :icon="createOutline"/></ion-button><ion-button fill="clear" aria-label="Excluir lançamento" @click="remove(item)"><ion-icon :icon="trashOutline"/></ion-button></div></div></div>
      <div v-else class="empty-state empty-transactions"><span class="empty-icon"><ion-icon :icon="isIncome ? arrowDownCircleOutline : arrowUpCircleOutline"/></span><strong>{{ search || period !== 'all' ? 'Nenhum resultado encontrado' : `Nenhuma ${isIncome ? 'receita' : 'despesa'} por aqui ainda` }}</strong><span>{{ search || period !== 'all' ? 'Tente mudar os filtros da busca.' : 'Adicione seu primeiro lançamento para começar a acompanhar.' }}</span><ion-button v-if="!search && period === 'all'" @click="openNew">Adicionar {{ isIncome ? 'receita' : 'despesa' }}</ion-button></div>
      <div v-if="filtered.length" class="table-footer">{{ filtered.length }} lançamento{{ filtered.length === 1 ? '' : 's' }} <span>Total no período <strong>{{ money(filtered.reduce((sum, item) => sum + item.amount, 0)) }}</strong></span></div>
    </section>
    <TransactionModal :open="modalOpen" :kind="kind" :item="selected" :saving="saving" @close="modalOpen = false" @save="save"/>
  </AppShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, alertController, toastController } from '@ionic/vue'
import { addOutline, searchOutline, calendarOutline, arrowDownOutline, arrowUpOutline, arrowDownCircleOutline, arrowUpCircleOutline, createOutline, trashOutline, sparklesOutline } from 'ionicons/icons'
import AppShell from '../components/AppShell.vue'
import TransactionModal from '../components/TransactionModal.vue'
import { listTransactions, saveTransaction, deleteTransaction } from '../services/transactions'
import { hasSupabaseConfig } from '../services/supabase'

const props = defineProps({ kind: { type: String, default: 'expense' } })
const kind = computed(() => props.kind), isIncome = computed(() => kind.value === 'income')
const rows = ref([]), error = ref(''), search = ref(''), period = ref('all'), modalOpen = ref(false), selected = ref(null), saving = ref(false)
const money = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)).replace('.', '')
const filtered = computed(() => { const now = new Date(), month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1), prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`; return rows.value.filter((item) => { const q = search.value.trim().toLocaleLowerCase('pt-BR'), matchesText = !q || `${item.description} ${item.category}`.toLocaleLowerCase('pt-BR').includes(q), matchesPeriod = period.value === 'all' || (period.value === 'month' && item.date.startsWith(month)) || (period.value === 'lastMonth' && item.date.startsWith(prev)) || (period.value === 'year' && item.date.startsWith(String(now.getFullYear()))); return matchesText && matchesPeriod }).sort((a, b) => b.date.localeCompare(a.date)) })
async function load() { try { rows.value = await listTransactions(kind.value); error.value = '' } catch (e) { error.value = e.message || 'Não foi possível carregar os lançamentos.' } }
function openNew() { selected.value = null; modalOpen.value = true }
function edit(item) { selected.value = item; modalOpen.value = true }
async function save(item) { saving.value = true; try { await saveTransaction(kind.value, item); modalOpen.value = false; await load(); const toast = await toastController.create({ message: 'Lançamento salvo com sucesso.', duration: 1800, color: 'success' }); await toast.present() } catch (e) { error.value = e.message || 'Não foi possível salvar.' } finally { saving.value = false } }
async function remove(item) { const alert = await alertController.create({ header: 'Excluir lançamento?', message: `“${item.description}” será removido permanentemente.`, buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Excluir', role: 'destructive', handler: async () => { try { await deleteTransaction(kind.value, item.id); await load() } catch (e) { error.value = e.message || 'Não foi possível excluir.' } } }] }); await alert.present() }
onMounted(load)
</script>
