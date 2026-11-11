import { supabase, hasSupabaseConfig } from './supabase'

const keyFor = (kind) => `saldo-${kind === 'income' ? 'receitas' : 'despesas'}`

function seed(kind) {
  const today = new Date()
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return kind === 'income' ? [
    { id: 'demo-i1', description: 'Salário', amount: 5200, category: 'Salário', date: `${month}-05`, kind },
    { id: 'demo-i2', description: 'Projeto freelance', amount: 850, category: 'Freelance', date: `${month}-12`, kind },
  ] : [
    { id: 'demo-e1', description: 'Aluguel', amount: 1650, category: 'Moradia', date: `${month}-03`, kind },
    { id: 'demo-e2', description: 'Mercado da semana', amount: 438.7, category: 'Alimentação', date: `${month}-09`, kind },
    { id: 'demo-e3', description: 'Conta de luz', amount: 147.3, category: 'Moradia', date: `${month}-11`, kind },
    { id: 'demo-e4', description: 'Transporte', amount: 96, category: 'Transporte', date: `${month}-14`, kind },
  ]
}

function localRead(kind) {
  const key = keyFor(kind)
  const raw = localStorage.getItem(key)
  if (raw) return JSON.parse(raw)
  const initial = seed(kind)
  localStorage.setItem(key, JSON.stringify(initial))
  return initial
}

function normalize(row, kind) {
  return { id: row.id, description: row.descricao, amount: Number(row.valor), category: row.categoria, date: row.data, kind }
}

export async function listTransactions(kind) {
  if (!hasSupabaseConfig.value) return localRead(kind)
  const table = kind === 'income' ? 'receitas' : 'despesas'
  const { data, error } = await supabase.from(table).select('*').order('data', { ascending: false })
  if (error) throw error
  return data.map((row) => normalize(row, kind))
}

export async function saveTransaction(kind, item) {
  if (!hasSupabaseConfig.value) {
    const key = keyFor(kind)
    const rows = localRead(kind)
    const updated = item.id ? rows.map((row) => row.id === item.id ? { ...item } : row) : [...rows, { ...item, id: crypto.randomUUID(), kind }]
    localStorage.setItem(key, JSON.stringify(updated))
    return
  }
  const table = kind === 'income' ? 'receitas' : 'despesas'
  const payload = { descricao: item.description, valor: item.amount, categoria: item.category, data: item.date }
  const query = item.id ? supabase.from(table).update(payload).eq('id', item.id) : supabase.from(table).insert(payload)
  const { error } = await query
  if (error) throw error
}

export async function deleteTransaction(kind, id) {
  if (!hasSupabaseConfig.value) {
    localStorage.setItem(keyFor(kind), JSON.stringify(localRead(kind).filter((row) => row.id !== id)))
    return
  }
  const table = kind === 'income' ? 'receitas' : 'despesas'
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
