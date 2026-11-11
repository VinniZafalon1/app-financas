<template>
  <AppShell>
    <div class="page-heading">
      <div><span class="eyebrow">SUA CONTA</span><h1>Perfil<span class="heading-period">.</span></h1><p>Personalize como seu perfil aparece no aplicativo.</p></div>
    </div>
    <div v-if="!hasSupabaseConfig" class="demo-notice"><ion-icon :icon="informationCircleOutline"/><span>As alterações do perfil ficam salvas neste navegador.</span></div>
    <div v-if="error" class="inline-error" role="alert">{{ error }}</div>
    <form class="profile-layout" @submit.prevent="submit">
      <section class="panel profile-preview">
        <div class="profile-avatar" :style="{ backgroundColor: form.avatarColor }"><img v-if="form.photoUrl" :src="form.photoUrl" alt="Foto do perfil"/><span v-else>{{ profileInitials(form.name || 'Meu perfil') }}</span></div>
        <div class="profile-preview-copy"><strong>{{ form.name || 'Seu nome' }}</strong><span>{{ profile.email || 'Conta do aplicativo' }}</span></div>
        <input ref="photoInput" class="profile-file-input" type="file" accept="image/png,image/jpeg,image/webp" @change="handlePhotoChange"/>
        <div class="profile-photo-actions"><ion-button fill="outline" size="small" :disabled="savingPhoto" @click="choosePhoto">{{ savingPhoto ? 'Enviando…' : 'Trocar foto' }}</ion-button><ion-button v-if="form.photoUrl" fill="clear" size="small" :disabled="savingPhoto" @click="deletePhoto">Remover</ion-button><span>JPG, PNG ou WebP. A imagem será ajustada para um recorte quadrado.</span></div>
      </section>
      <section class="panel profile-form">
        <div class="profile-section-heading"><h2>Informações básicas</h2><p>Seu e-mail identifica sua conta e não pode ser alterado aqui.</p></div>
        <label class="profile-field">Nome de exibição<ion-input v-model="form.name" maxlength="40" minlength="2" required placeholder="Como devemos chamar você?" /></label>
        <label class="profile-field">E-mail<ion-input :value="profile.email" readonly /></label>
        <fieldset class="avatar-color-field"><legend>Cor do avatar</legend><div class="color-options"><button v-for="color in avatarColors" :key="color" type="button" class="color-option" :class="{ selected: form.avatarColor === color }" :style="{ '--avatar-choice': color }" :aria-label="`Selecionar cor ${color}`" :aria-pressed="form.avatarColor === color" @click="form.avatarColor = color"><ion-icon v-if="form.avatarColor === color" :icon="checkmarkOutline"/></button></div></fieldset>
        <div class="profile-actions"><span v-if="savedMessage" class="profile-saved" role="status">{{ savedMessage }}</span><ion-button type="submit" :disabled="saving || savingPhoto">{{ saving ? 'Salvando…' : 'Salvar perfil' }}</ion-button></div>
      </section>
    </form>
  </AppShell>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { IonButton, IonIcon, IonInput, toastController } from '@ionic/vue'
import { checkmarkOutline, informationCircleOutline } from 'ionicons/icons'
import AppShell from '../components/AppShell.vue'
import { avatarColors, loadProfile, profile, profileInitials, removeProfilePhoto, saveProfile, uploadProfilePhoto } from '../services/profile'
import { hasSupabaseConfig } from '../services/supabase'

const form = reactive({ name: '', avatarColor: avatarColors[0] })
const photoInput = ref(null)
const saving = ref(false), savingPhoto = ref(false), error = ref(''), savedMessage = ref('')
onMounted(async () => {
  try { await loadProfile(); form.name = profile.value.name; form.avatarColor = profile.value.avatarColor; form.photoUrl = profile.value.photoUrl }
  catch (e) { error.value = e.message || 'Não foi possível carregar o perfil.' }
})
function choosePhoto() { photoInput.value?.click() }
async function handlePhotoChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { error.value = 'Escolha uma imagem JPG, PNG ou WebP.'; return }
  if (file.size > 5 * 1024 * 1024) { error.value = 'A imagem precisa ter até 5 MB.'; return }
  savingPhoto.value = true; error.value = ''
  try {
    const image = await createImageBitmap(file)
    const crop = Math.min(image.width, image.height)
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a imagem.')
    context.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, 512, 512)
    image.close?.()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob) throw new Error('Não foi possível converter a imagem.')
    await uploadProfilePhoto(blob)
    form.photoUrl = profile.value.photoUrl
    const toast = await toastController.create({ message: 'Foto de perfil atualizada.', duration: 1800, color: 'success' })
    await toast.present()
  } catch (e) { error.value = e.message || 'Não foi possível enviar a foto.' }
  finally { savingPhoto.value = false }
}
async function deletePhoto() {
  savingPhoto.value = true; error.value = ''
  try {
    await removeProfilePhoto(); form.photoUrl = ''
    const toast = await toastController.create({ message: 'Foto removida.', duration: 1800, color: 'success' })
    await toast.present()
  } catch (e) { error.value = e.message || 'Não foi possível remover a foto.' }
  finally { savingPhoto.value = false }
}
async function submit() {
  saving.value = true; error.value = ''; savedMessage.value = ''
  try {
    await saveProfile(form)
    savedMessage.value = 'Perfil salvo.'
    const toast = await toastController.create({ message: 'Perfil atualizado.', duration: 1800, color: 'success' })
    await toast.present()
  } catch (e) { error.value = e.message || 'Não foi possível salvar o perfil.' }
  finally { saving.value = false }
}
</script>
