import { ref } from 'vue'
import { supabase, hasSupabaseConfig } from './supabase'
import { useSession } from './session'

const defaultColor = '#33865c'
export const avatarColors = ['#33865c', '#5268a6', '#a35c44', '#7754a3', '#247f8a', '#bb7b23']
export const profile = ref({ name: 'Meu perfil', email: '', avatarColor: defaultColor, photoUrl: '', avatarPath: '' })

const avatarBucket = 'profile-avatars'

async function signedPhotoUrl(path) {
  if (!path) return ''
  const { data, error } = await supabase.storage.from(avatarBucket).createSignedUrl(path, 60 * 60 * 24)
  if (error) return ''
  return data.signedUrl
}

function readLocalProfile() {
  try {
    const saved = localStorage.getItem('saldo-demo-profile')
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

export async function loadProfile() {
  if (hasSupabaseConfig.value) {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    const user = data.user
    const saved = user.user_metadata || {}
    profile.value = {
      name: saved.display_name || user.email?.split('@')[0] || 'Meu perfil',
      email: user.email || '',
      avatarColor: avatarColors.includes(saved.avatar_color) ? saved.avatar_color : defaultColor,
      avatarPath: saved.avatar_path || '',
      photoUrl: await signedPhotoUrl(saved.avatar_path),
    }
    return profile.value
  }

  const saved = readLocalProfile() || {}
  const email = useSession().demoSession.value?.email || 'demo@saldo.app'
  profile.value = {
    name: saved.name || 'Minha conta',
    email,
    avatarColor: avatarColors.includes(saved.avatarColor) ? saved.avatarColor : defaultColor,
    avatarPath: '',
    photoUrl: saved.photoDataUrl || '',
  }
  return profile.value
}

export async function uploadProfilePhoto(blob) {
  if (blob.type !== 'image/jpeg' || blob.size > 2 * 1024 * 1024) {
    throw new Error('A foto precisa estar em JPEG e ter até 2 MB após o recorte.')
  }

  if (hasSupabaseConfig.value) {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    const path = `${user.id}/avatar.jpg`
    const { error: uploadError } = await supabase.storage.from(avatarBucket).upload(path, blob, {
      cacheControl: '3600', contentType: 'image/jpeg', upsert: true,
    })
    if (uploadError) throw uploadError
    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_path: path } })
    if (updateError) throw updateError
    profile.value = { ...profile.value, avatarPath: path, photoUrl: await signedPhotoUrl(path) }
  } else {
    const photoDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
      reader.readAsDataURL(blob)
    })
    profile.value = { ...profile.value, avatarPath: '', photoUrl: photoDataUrl }
    try {
      localStorage.setItem('saldo-demo-profile', JSON.stringify({
        name: profile.value.name, avatarColor: profile.value.avatarColor, photoDataUrl,
      }))
    } catch { throw new Error('Não há espaço disponível no navegador para salvar esta foto.') }
  }
  return profile.value
}

export async function removeProfilePhoto() {
  if (hasSupabaseConfig.value) {
    const path = profile.value.avatarPath
    if (path) {
      const { error } = await supabase.storage.from(avatarBucket).remove([path])
      if (error) throw error
    }
    const { error } = await supabase.auth.updateUser({ data: { avatar_path: null } })
    if (error) throw error
    profile.value = { ...profile.value, avatarPath: '', photoUrl: '' }
  } else {
    profile.value = { ...profile.value, photoUrl: '', avatarPath: '' }
    try {
      localStorage.setItem('saldo-demo-profile', JSON.stringify({ name: profile.value.name, avatarColor: profile.value.avatarColor }))
    } catch { throw new Error('Não foi possível atualizar o perfil neste navegador.') }
  }
  return profile.value
}

export async function saveProfile({ name, avatarColor }) {
  const cleanName = name.trim()
  if (cleanName.length < 2 || cleanName.length > 40) throw new Error('O nome deve ter entre 2 e 40 caracteres.')
  if (!avatarColors.includes(avatarColor)) throw new Error('Escolha uma das cores disponíveis.')

  if (hasSupabaseConfig.value) {
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: cleanName, avatar_color: avatarColor } })
    if (error) throw error
    profile.value = { ...profile.value, name: cleanName, email: data.user.email || profile.value.email, avatarColor }
  } else {
    profile.value = { ...profile.value, name: cleanName, avatarColor }
    try { localStorage.setItem('saldo-demo-profile', JSON.stringify({
      name: cleanName, avatarColor, ...(profile.value.photoUrl ? { photoDataUrl: profile.value.photoUrl } : {}),
    })) } catch {}
  }
  return profile.value
}

export function profileInitials(name = profile.value.name) {
  return (name.match(/[A-Za-zÀ-ÿ0-9]+/g) || ['M']).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}
