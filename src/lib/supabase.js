import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'SUA_CHAVE_ANON_AQUI') {
    console.warn('Supabase credentials missing. Cloud backup disabled.');
}

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'SUA_CHAVE_ANON_AQUI')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
