import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({} as SupabaseClient)

let supabaseServer: SupabaseClient | null = null

export const getSupabaseServer = () => {
  if (!supabaseServer && supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseServer = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }
  return supabaseServer
}

export default supabase
