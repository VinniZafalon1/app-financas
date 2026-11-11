import { computed } from 'vue'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
export const hasSupabaseConfig = computed(() => Boolean(url && key))
export const supabase = hasSupabaseConfig.value ? createClient(url, key) : null
