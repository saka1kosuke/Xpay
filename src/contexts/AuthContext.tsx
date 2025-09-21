'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (name: string, email: string, password: string, role: 'admin' | 'member', adminPassword?: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // セッションの確認
    const checkSession = async () => {
      try {
        const session = localStorage.getItem('xpay_session')
        if (session) {
          const userData = JSON.parse(session)
          setUser(userData)
        }
      } catch (error) {
        console.error('セッション確認エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !data) {
        return { success: false, message: 'メールアドレスまたはパスワードが正しくありません。' }
      }

              // セッションに保存
        localStorage.setItem('xpay_session', JSON.stringify(data))
        setUser(data)
        console.log('ログイン成功:', data)
        return { success: true, message: 'ログインに成功しました。' }
    } catch (error) {
      console.error('ログインエラー:', error)
      return { success: false, message: 'ログイン中にエラーが発生しました。' }
    }
  }

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: 'admin' | 'member', 
    adminPassword?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Supabase接続確認:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
      
      // Supabase接続テスト
      try {
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        console.log('接続テスト結果:', { testData, testError })
        
        if (testError) {
          console.error('接続テストエラー:', testError)
          return { success: false, message: `Supabase接続エラー: ${testError.message || '不明なエラー'}` }
        }
      } catch (error) {
        console.error('接続テストで例外が発生:', error)
        return { success: false, message: `Supabase接続で例外が発生: ${error}` }
      }
      
      // adminロールの場合はパスワード確認
      if (role === 'admin' && adminPassword !== '1234') {
        return { success: false, message: '管理者パスワードが正しくありません。' }
      }

      // メールアドレスの重複チェック
      console.log('重複チェック開始:', { email })
      
      let existingUser: any = null
      
      try {
        const { data: userData, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()

        existingUser = userData
        console.log('重複チェック結果:', { existingUser, checkError })
        console.log('checkErrorの型:', typeof checkError)
        console.log('checkErrorの内容:', JSON.stringify(checkError, null, 2))

        if (checkError) {
          console.error('重複チェックエラー詳細:', {
            message: checkError.message,
            details: checkError.details,
            hint: checkError.hint,
            code: checkError.code,
            fullError: checkError
          })
          
          // PGRST116は「行が見つからない」エラー（正常）
          if (checkError.code !== 'PGRST116') {
            return { success: false, message: `ユーザー確認中にエラーが発生しました: ${checkError.message || checkError.details || '不明なエラー'}` }
          }
        }
      } catch (error) {
        console.error('重複チェックで例外が発生:', error)
        return { success: false, message: `ユーザー確認中に例外が発生しました: ${error}` }
      }

      if (existingUser) {
        return { success: false, message: 'このメールアドレスは既に使用されています。' }
      }

      // ユーザー作成
      const userData = {
        name,
        email,
        password,
        role,
        total_deposit: 0,
        total_withdraw: 0,
        balance: 0,
        created_by: null // 新規ユーザー作成時はnull
      }
      
      console.log('作成しようとしているユーザーデータ:', userData)
      
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) {
        console.error('ユーザー作成エラー:', error)
        console.error('エラーの詳細:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return { success: false, message: `アカウント作成中にエラーが発生しました: ${error.message || error.details || error.hint || '不明なエラー'}` }
      }

      return { success: true, message: 'アカウントが正常に作成されました。' }
    } catch (error) {
      console.error('登録エラー:', error)
      return { success: false, message: 'アカウント作成中にエラーが発生しました。' }
    }
  }

  const logout = async (): Promise<void> => {
    localStorage.removeItem('xpay_session')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
