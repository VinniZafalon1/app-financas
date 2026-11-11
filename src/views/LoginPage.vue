<template>
  <ion-page><ion-content class="auth-page"><div class="auth-grid">
    <section class="auth-story"><div class="menu-brand"><span class="brand-mark">s</span><span>saldo<span class="brand-dot">.</span></span></div><div class="story-copy"><span class="eyebrow"><span class="status-dot"></span> SUA VIDA FINANCEIRA, MAIS LEVE</span><h1>Clareza para<br/>fazer seu dinheiro<br/><em>ir mais longe.</em></h1><p>Acompanhe o que entra, o que sai e tome decisões com mais confiança.</p></div><div class="story-bottom"><div class="story-stat"><strong>Visão completa</strong><span>Tudo em um só lugar.</span></div><div class="story-stat"><strong>Sem complicação</strong><span>Organização no seu ritmo.</span></div></div><div class="story-orb orb-one"></div><div class="story-orb orb-two"></div></section>
    <section class="auth-form-wrap"><div class="auth-form-card"><div class="mobile-auth-brand menu-brand"><span class="brand-mark">s</span><span>saldo<span class="brand-dot">.</span></span></div><span class="eyebrow">BEM-VINDO DE VOLTA</span><h2>{{ registerMode ? 'Crie sua conta' : 'Entre na sua conta' }}</h2><p class="auth-subtitle">{{ registerMode ? 'Comece a cuidar melhor do seu dinheiro.' : 'Que bom ter você por aqui novamente.' }}</p>
      <form class="auth-fields" @submit.prevent="submit"><label>E-mail<ion-input v-model="email" type="email" autocomplete="email" placeholder="voce@email.com" required /></label><label>Senha<ion-input v-model="password" type="password" :autocomplete="registerMode ? 'new-password' : 'current-password'" placeholder="Mínimo de 6 caracteres" minlength="6" required /></label>
        <ion-button expand="block" type="submit" :disabled="loading">{{ loading ? 'Aguarde…' : (registerMode ? 'Criar minha conta' : 'Entrar na minha conta') }}</ion-button>
      </form>
      <div v-if="!hasSupabaseConfig" class="demo-box"><div><strong>Quer conhecer o app?</strong><span>Entre sem criar conta e explore os dados de exemplo.</span></div><ion-button fill="outline" @click="enterDemo">Explorar demonstração</ion-button></div>
      <p class="auth-switch">{{ registerMode ? 'Já tem uma conta?' : 'Ainda não tem uma conta?' }} <router-link :to="registerMode ? '/login' : '/cadastro'">{{ registerMode ? 'Fazer login' : 'Criar conta' }}</router-link></p>
      <p v-if="message" class="auth-message" role="status">{{ message }}</p>
    </div><span class="auth-legal">Seus dados financeiros são pessoais e protegidos.</span></section>
  </div></ion-content></ion-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonInput, IonButton } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { supabase, hasSupabaseConfig } from '../services/supabase'
import { useSession } from '../services/session'

const route = useRoute(), router = useRouter(), registerMode = computed(() => route.path === '/cadastro')
const email = ref(''), password = ref(''), message = ref(''), loading = ref(false)
const { startDemo } = useSession()
async function submit() {
  message.value = ''
  if (!hasSupabaseConfig.value) { message.value = 'Configure o Supabase no arquivo .env para ativar o login.'; return }
  loading.value = true
  try {
    const result = registerMode.value
      ? await supabase.auth.signUp({ email: email.value, password: password.value, options: { emailRedirectTo: Capacitor.isNativePlatform() ? 'br.com.vzafalon.saldo://auth-callback' : `${window.location.origin}/login` } })
      : await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    const { data, error } = result
    if (error) throw error
    if (registerMode.value && data.session) router.replace('/')
    else if (registerMode.value) message.value = 'Conta criada. Confira seu e-mail para confirmar o cadastro.'
    else router.replace('/')
  } catch (error) { message.value = error.message || 'Não foi possível entrar. Tente novamente.' }
  finally { loading.value = false }
}
function enterDemo() { startDemo(); router.replace('/') }
</script>
