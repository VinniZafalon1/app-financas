<template>
  <ion-modal :is-open="open" @did-dismiss="$emit('close')" class="transaction-modal">
    <ion-header><ion-toolbar><ion-title>{{ item?.id ? 'Editar lançamento' : (kind === 'income' ? 'Nova receita' : 'Nova despesa') }}</ion-title><ion-buttons slot="end"><ion-button @click="$emit('close')">Fechar</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <form class="entry-form" @submit.prevent="submit">
        <label>Descrição<ion-input v-model="form.description" placeholder="Ex.: Conta de internet" required maxlength="80" /></label>
        <label>Valor<ion-input v-model="form.amount" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="0,00" required /></label>
        <label>Categoria<ion-select v-model="form.category" interface="popover" placeholder="Selecione" required><ion-select-option v-for="option in categories" :key="option" :value="option">{{ option }}</ion-select-option></ion-select></label>
        <label>Data<ion-input v-model="form.date" type="date" required /></label>
        <div class="form-actions"><ion-button fill="outline" color="medium" @click.prevent="$emit('close')">Cancelar</ion-button><ion-button type="submit" :disabled="saving">{{ saving ? 'Salvando…' : 'Salvar lançamento' }}</ion-button></div>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonSelect, IonSelectOption } from '@ionic/vue'

const props = defineProps({ open: Boolean, kind: { type: String, default: 'expense' }, item: { type: Object, default: null }, saving: Boolean })
const emit = defineEmits(['close', 'save'])
const categories = computed(() => props.kind === 'income' ? ['Salário', 'Freelance', 'Investimentos', 'Outros'] : ['Alimentação', 'Transporte', 'Moradia', 'Educação', 'Lazer', 'Saúde', 'Outros'])
const form = reactive({ description: '', amount: '', category: '', date: new Date().toISOString().slice(0, 10) })
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }
form.date = localDate()
watch(() => [props.open, props.item], () => { if (props.open) Object.assign(form, props.item ? { ...props.item, amount: String(props.item.amount) } : { description: '', amount: '', category: '', date: localDate() }) }, { immediate: true })
function submit() {
  const amount = Number(form.amount)
  if (!Number.isFinite(amount) || amount <= 0) return
  emit('save', { ...form, amount, kind: props.kind, ...(props.item?.id ? { id: props.item.id } : {}) })
}
</script>
