import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// 環境変数の取得（フォールバック付き）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuhhmdnmzeqkwkcohxye.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1aGhtZG5temVxa3drY29oeXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTE3NTAsImV4cCI6MjA3MTA2Nzc1MH0.25W3B56Aw-SmFYWsU-K_9R1i6dVp46Ao_-cjIrP_Jzw'

// 環境変数のデバッグ出力
console.log('Supabase設定:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  fromEnv: !!process.env.NEXT_PUBLIC_SUPABASE_URL
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// データベースの型定義
export interface Product {
  id: string
  name: string
  description?: string | null
  buy_price: number
  sell_price: number
  stock: number
  bought_count: number
  sold_count: number
  category?: string | null
  image_url?: string | null
  created_by?: string | null
  expiry_date?: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'member'
  total_deposit: number
  total_withdraw: number
  balance: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: Product
}

export interface Order {
  id: string
  user_id: string
  total_amount: number
  status: 'pending' | 'completed' | 'cancelled'
  payment_method?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdraw' | 'purchase'
  amount: number
  description?: string | null
  related_order_id?: string | null
  created_at: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  category: string
  created_at: string
}
