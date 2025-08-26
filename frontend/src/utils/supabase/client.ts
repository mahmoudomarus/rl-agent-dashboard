import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Environment variables:')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set')
}

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL environment variable is required. Please set it in Vercel dashboard.')
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required. Please set it in Vercel dashboard.')
}

// Create a single Supabase client instance to avoid multiple GoTrueClient instances
export const supabase = createClient(supabaseUrl, supabaseAnonKey)