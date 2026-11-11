import { createRouter, createWebHistory } from '@ionic/vue-router'
import { supabase, hasSupabaseConfig } from './services/supabase'
import { useSession } from './services/session'

const routes = [
  { path: '/login', component: () => import('./views/LoginPage.vue'), meta: { guest: true } },
  { path: '/cadastro', component: () => import('./views/LoginPage.vue'), meta: { guest: true, register: true } },
  { path: '/', component: () => import('./views/DashboardPage.vue'), meta: { auth: true } },
  { path: '/receitas', component: () => import('./views/TransactionsPage.vue'), props: { kind: 'income' }, meta: { auth: true } },
  { path: '/despesas', component: () => import('./views/TransactionsPage.vue'), props: { kind: 'expense' }, meta: { auth: true } },
  { path: '/perfil', component: () => import('./views/ProfilePage.vue'), meta: { auth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach(async (to) => {
  if (!hasSupabaseConfig.value) {
    const { demoSession } = useSession()
    if (to.meta.auth && !demoSession.value) return '/login'
    if (to.meta.guest && demoSession.value) return '/'
    return true
  }
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (to.meta.auth && !session) return '/login'
    if (to.meta.guest && session) return '/'
  } catch {
    if (to.meta.auth) return '/login'
  }
  return true
})

export default router
