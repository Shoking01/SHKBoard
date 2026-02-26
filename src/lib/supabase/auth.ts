import { supabase } from './client'

export async function redirectIfAuthenticated() {
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    window.location.href = '/dashboard'
  }
}

export async function redirectIfNotAuthenticated() {
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    window.location.href = '/login'
  }
}
