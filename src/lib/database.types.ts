export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          role: 'admin' | 'member'
          created_by?: string | null
          total_deposit: number
          total_withdraw: number
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          role: 'admin' | 'member'
          created_by?: string | null
          total_deposit?: number
          total_withdraw?: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          role?: 'admin' | 'member'
          created_by?: string | null
          total_deposit?: number
          total_withdraw?: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          description?: string | null
          buy_price: number
          sell_price: number
          expiry_date?: string | null
          category?: string | null
          image_url?: string | null
          created_by?: string | null
          stock: number
          bought_count: number
          sold_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          buy_price: number
          sell_price: number
          expiry_date?: string | null
          category?: string | null
          image_url?: string | null
          created_by?: string | null
          stock?: number
          bought_count?: number
          sold_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          buy_price?: number
          sell_price?: number
          expiry_date?: string | null
          category?: string | null
          image_url?: string | null
          created_by?: string | null
          stock?: number
          bought_count?: number
          sold_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      money_table: {
        Row: {
          id: string
          user_id?: string | null
          deposit: number
          withdraw: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          deposit?: number
          withdraw?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          deposit?: number
          withdraw?: number
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          description: string
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          category?: string
          created_at?: string
        }
      }
      incomes: {
        Row: {
          id: string
          amount: number
          description: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          description: string
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          source?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_stock: {
        Args: {
          p_item_id: string
          p_quantity: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
