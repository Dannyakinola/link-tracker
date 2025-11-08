    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

    export const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('supabase.auth.token', session.access_token)
    } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase.auth.token')
    }
    })