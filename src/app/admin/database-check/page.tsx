'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

interface TableInfo {
  name: string
  exists: boolean
  columns?: string[]
  count?: number
  error?: string
}

export default function DatabaseCheckPage() {
  const { user } = useAuth()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      checkDatabase()
    }
  }, [user])

  const checkDatabase = async () => {
    const tableNames = ['users', 'items', 'money_table', 'expenses']
    const tableResults: TableInfo[] = []

    for (const tableName of tableNames) {
      try {
        // テーブルの存在確認とカラム情報取得
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          tableResults.push({
            name: tableName,
            exists: false,
            error: error.message
          })
        } else {
          // レコード数取得
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          tableResults.push({
            name: tableName,
            exists: true,
            columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            count: count || 0
          })
        }
      } catch (err) {
        tableResults.push({
          name: tableName,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    setTables(tableResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">データベースを確認中...</div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">データベース構成確認</h1>
            <p className="text-gray-600 mt-2">現在のSupabaseデータベースのテーブル構成</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">テーブル一覧</h2>
            
            <div className="space-y-4">
              {tables.map((table) => (
                <div key={table.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {table.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      table.exists 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {table.exists ? '存在' : '不存在'}
                    </span>
                  </div>
                  
                  {table.exists ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>レコード数:</strong> {table.count} 件
                      </div>
                      {table.columns && table.columns.length > 0 && (
                        <div>
                          <strong className="text-sm text-gray-600">カラム:</strong>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {table.columns.map((column) => (
                              <span 
                                key={column}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {column}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      <strong>エラー:</strong> {table.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Supabase接続情報</h3>
            <div className="text-sm text-blue-800">
              <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

