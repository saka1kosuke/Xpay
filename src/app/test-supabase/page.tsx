'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('テスト開始...\n')
    
    try {
      // 1. 基本的な接続テスト
      setResult(prev => prev + '1. 基本的な接続テスト...\n')
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        setResult(prev => prev + `エラー: ${JSON.stringify(error, null, 2)}\n`)
      } else {
        setResult(prev => prev + `成功: ${JSON.stringify(data, null, 2)}\n`)
      }
      
      // 2. テーブル一覧の確認
      setResult(prev => prev + '\n2. テーブル一覧確認...\n')
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      if (tablesError) {
        setResult(prev => prev + `テーブル一覧エラー: ${JSON.stringify(tablesError, null, 2)}\n`)
      } else {
        setResult(prev => prev + `テーブル一覧: ${JSON.stringify(tables, null, 2)}\n`)
      }
      
      // 3. ユーザー作成テスト
      setResult(prev => prev + '\n3. ユーザー作成テスト...\n')
      const testUser = {
        name: 'テストユーザー',
        email: `test${Date.now()}@example.com`,
        password: 'test123',
        role: 'member'
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(testUser)
        .select()
        .single()
      
      if (userError) {
        setResult(prev => prev + `ユーザー作成エラー: ${JSON.stringify(userError, null, 2)}\n`)
      } else {
        setResult(prev => prev + `ユーザー作成成功: ${JSON.stringify(userData, null, 2)}\n`)
      }
      
    } catch (error) {
      setResult(prev => prev + `例外エラー: ${error instanceof Error ? error.message : String(error)}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Supabase接続テスト</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'テスト中...' : '接続テストを実行'}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">テスト結果</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
            {result || 'テストを実行してください'}
          </pre>
        </div>
      </div>
    </div>
  )
}




