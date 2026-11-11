import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'
import router from '../router'

async function handleAuthLink(rawUrl) {
  if (!supabase || !rawUrl) return
  try {
    const url = new URL(rawUrl)
    const code = url.searchParams.get('code')
    let error
    if (code) {
      ({ error } = await supabase.auth.exchangeCodeForSession(code))
    } else {
      const params = new URLSearchParams(url.hash.slice(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (!access_token || !refresh_token) return
      ({ error } = await supabase.auth.setSession({ access_token, refresh_token }))
    }
    if (error) throw error
    await router.replace('/')
  } catch {
    await router.replace('/login')
  }
}

export async function registerAuthDeepLinks() {
  if (!Capacitor.isNativePlatform() || !supabase) return
  await App.addListener('appUrlOpen', ({ url }) => handleAuthLink(url))
  const launch = await App.getLaunchUrl()
  if (launch?.url) await handleAuthLink(launch.url)
}
