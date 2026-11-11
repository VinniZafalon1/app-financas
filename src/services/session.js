import { ref } from 'vue'

let stored = null
try { stored = localStorage.getItem('saldo-demo-session') } catch {}
let parsed = null
try { parsed = stored ? JSON.parse(stored) : null } catch {}
const demoSession = ref(parsed)

export function useSession() {
  function startDemo(email = 'demo@saldo.app') {
    demoSession.value = { email }
    try { localStorage.setItem('saldo-demo-session', JSON.stringify(demoSession.value)) } catch {}
  }
  function endDemo() {
    demoSession.value = null
    try { localStorage.removeItem('saldo-demo-session') } catch {}
  }
  return { demoSession, startDemo, endDemo }
}
