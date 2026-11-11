<template>
  <ion-page>
    <ion-menu content-id="main-content" class="side-menu">
      <ion-content>
        <div class="menu-brand"><span class="brand-mark">s</span><span>saldo<span class="brand-dot">.</span></span></div>
        <div class="menu-label">MENU PRINCIPAL</div>
        <ion-list lines="none">
          <ion-menu-toggle v-for="link in links" :key="link.to" :auto-hide="true">
            <ion-item :router-link="link.to" router-direction="root" :class="{ active: route.path === link.to }">
              <ion-icon :icon="link.icon" slot="start" /><ion-label>{{ link.label }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
        <div class="menu-footer"><router-link to="/perfil" class="profile-avatar-link" aria-label="Editar perfil"><div class="avatar" :style="avatarStyle"><img v-if="profile.photoUrl" :src="profile.photoUrl" alt=""/><span v-else>{{ initials }}</span></div></router-link><div class="user-copy"><strong>{{ userName }}</strong><span>Plano gratuito</span></div><ion-button fill="clear" class="logout-button" aria-label="Sair" @click="logout"><ion-icon :icon="logOutOutline" /></ion-button></div>
      </ion-content>
    </ion-menu>
    <div id="main-content" class="ion-page main-panel">
      <header class="topbar">
        <div class="topbar-left"><ion-button v-if="route.path !== '/'" class="topbar-back" fill="clear" aria-label="Voltar para a página anterior" @click="goBack"><ion-icon slot="icon-only" :icon="chevronBackOutline" /></ion-button><ion-menu-button aria-label="Abrir menu" /><span class="topbar-mobile-brand">saldo<span class="brand-dot">.</span></span><div class="breadcrumb">Visão geral <span>/</span> {{ currentLabel }}</div></div>
        <div class="topbar-right"><div class="today-chip"><span class="status-dot"></span> Suas finanças em dia</div><router-link to="/perfil" class="profile-avatar-link" aria-label="Abrir perfil"><div class="avatar avatar-small" :style="avatarStyle"><img v-if="profile.photoUrl" :src="profile.photoUrl" alt=""/><span v-else>{{ initials }}</span></div></router-link></div>
      </header>
      <ion-content class="content-area"><main class="page-container"><slot /></main></ion-content>
      <nav class="mobile-nav"><router-link v-for="link in mobileLinks" :key="link.to" :to="link.to"><ion-icon :icon="link.icon"/><span>{{ link.short }}</span></router-link></nav>
    </div>
  </ion-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonMenu, IonMenuToggle, IonList, IonItem, IonLabel, IonIcon, IonButton, IonMenuButton } from '@ionic/vue'
import { gridOutline, arrowDownCircleOutline, arrowUpCircleOutline, personCircleOutline, logOutOutline, chevronBackOutline } from 'ionicons/icons'
import { supabase, hasSupabaseConfig } from '../services/supabase'
import { useSession } from '../services/session'
import { loadProfile, profile, profileInitials } from '../services/profile'

const route = useRoute(), router = useRouter()
const links = [
  { to: '/', label: 'Dashboard', icon: gridOutline },
  { to: '/receitas', label: 'Receitas', icon: arrowDownCircleOutline },
  { to: '/despesas', label: 'Despesas', icon: arrowUpCircleOutline },
  { to: '/perfil', label: 'Perfil', icon: personCircleOutline },
]
const mobileLinks = links.filter((link) => link.to !== '/perfil').map((link) => ({ ...link, short: link.label === 'Dashboard' ? 'Início' : link.label }))
const currentLabel = computed(() => links.find((link) => link.to === route.path)?.label ?? 'Dashboard')
const { demoSession, endDemo } = useSession()
const userName = computed(() => profile.value.name || (hasSupabaseConfig.value ? 'Minha conta' : demoSession.value?.email || 'Modo demonstração'))
const initials = computed(() => profileInitials(userName.value))
const avatarStyle = computed(() => ({ backgroundColor: profile.value.avatarColor || '#33865c' }))
onMounted(() => { loadProfile().catch(() => {}) })
function goBack() {
  if (router.options.history.state.back) router.back()
  else router.replace('/')
}
async function logout() {
  if (hasSupabaseConfig.value) await supabase.auth.signOut()
  endDemo()
  router.replace('/login')
}
</script>
