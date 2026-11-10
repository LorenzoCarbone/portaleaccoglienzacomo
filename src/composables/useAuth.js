import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const user = ref(null)
const authLoading = ref(false)
const authError = ref('')
const authForm = ref({ email: '', password: '' })
const openAdminModal = ref(false)

export function useAuth() {
  const checkAuthSession = async () => {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session ? session.user : null

    supabase.auth.onAuthStateChange((_, session) => {
      user.value = session ? session.user : null
    })
  }

  const handleLogin = async () => {
    if (!supabase) return false
    authLoading.value = true
    authError.value = ''
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.value.email.trim(),
        password: authForm.value.password
      })
      if (error) throw error
      user.value = data.user
      authForm.value = { email: '', password: '' }
      openAdminModal.value = false
      return true
    } catch (err) {
      authError.value = 'Credenziali non valide.'
      return false
    } finally {
      authLoading.value = false
    }
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    user.value = null
    openAdminModal.value = false
  }

  return {
    user,
    authLoading,
    authError,
    authForm,
    openAdminModal,
    checkAuthSession,
    handleLogin,
    handleLogout
  }
}
