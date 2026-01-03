import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    // 这是一个保护措施，防止空密钥导致崩溃
    console.error('❌ SARA Error: Supabase 环境变量未找到！请检查 .env 文件。');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')