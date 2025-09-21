'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface ProfitData {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
}

interface Expense {
  id: string
  amount: number
  description: string
  category: string
  created_at: string
}

interface Income {
  id: string
  amount: number
  description: string
  source: string
  created_at: string
}

interface BalanceData {
  currentBalance: number
  totalIncome: number
  totalExpenses: number
}

export default function AccountingPage() {
  const { user } = useAuth()
  const [profitData, setProfitData] = useState<ProfitData>({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0
  })
  const [balanceData, setBalanceData] = useState<BalanceData>({
    currentBalance: 0,
    totalIncome: 0,
    totalExpenses: 0
  })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: '研究室物品'
  })
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [newIncome, setNewIncome] = useState({
    amount: '',
    description: '',
    source: 'manual'
  })
  const [showOverallIncomeForm, setShowOverallIncomeForm] = useState(false)
  const [overallIncomeAmount, setOverallIncomeAmount] = useState('')
  const [overallIncomeDesc, setOverallIncomeDesc] = useState('')

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAccountingData()
    }
  }, [user])

  const fetchAccountingData = async () => {
    try {
      setLoading(true)
      
      // 利益計算データの取得
      const { data: products } = await supabase
        .from('items')
        .select('sell_price, buy_price, sold_count')

      if (products) {
        const totalRevenue = products.reduce((sum, product) => 
          sum + (product.sell_price * product.sold_count), 0)
        const totalCost = products.reduce((sum, product) => 
          sum + (product.buy_price * product.sold_count), 0)
        const totalProfit = totalRevenue - totalCost
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

        setProfitData({
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin
        })
      }

      // 支出データの取得
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (expenseData) {
        setExpenses(expenseData)
        const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.amount, 0)
        
        setBalanceData(prev => ({
          ...prev,
          totalExpenses,
          currentBalance: prev.totalIncome - totalExpenses
        }))
      }

      // 収入データの取得（手入力の収入 + 残高管理でのチャージ）
      const [{ data: incomeData }, { data: depositsData }] = await Promise.all([
        supabase
          .from('incomes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('money_table')
          .select('deposit, created_at, user_id')
          .gt('deposit', 0)
          .order('created_at', { ascending: false })
      ])

      const manualIncomeTotal = (incomeData || []).reduce((sum, inc: any) => sum + (inc.amount || 0), 0)
      const depositIncomeTotal = (depositsData || []).reduce((sum, row: any) => sum + (row.deposit || 0), 0)
      const totalIncome = manualIncomeTotal + depositIncomeTotal

      setIncomes(
        (incomeData || []).map((r: any) => ({
          id: r.id,
          amount: r.amount,
          description: r.description,
          source: r.source || 'manual',
          created_at: r.created_at
        }))
      )

      // 残高 = 収入合計 - 支出合計（利益は別表示）
      setBalanceData(prev => ({
        ...prev,
        totalIncome,
        currentBalance: totalIncome - prev.totalExpenses
      }))

    } catch (error) {
      console.error('経理データの取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newExpense.amount || !newExpense.description) {
      alert('金額と説明を入力してください')
      return
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          amount: parseInt(newExpense.amount),
          description: newExpense.description,
          category: newExpense.category
        })
        .select()
        .single()

      if (error) {
        console.error('支出追加エラー:', error)
        alert('支出の追加に失敗しました')
        return
      }

      // データを再取得
      await fetchAccountingData()
      
      // フォームをリセット
      setNewExpense({
        amount: '',
        description: '',
        category: '研究室物品'
      })
      setShowExpenseForm(false)
      
      alert('支出が正常に追加されました')
    } catch (error) {
      console.error('支出追加エラー:', error)
      alert('支出の追加中にエラーが発生しました')
    }
  }

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIncome.amount || !newIncome.description) {
      alert('金額と説明を入力してください')
      return
    }
    try {
      const { error } = await supabase
        .from('incomes')
        .insert({
          amount: parseInt(newIncome.amount),
          description: newIncome.description,
          source: newIncome.source
        })

      if (error) {
        console.error('収入追加エラー:', error)
        alert('収入の追加に失敗しました')
        return
      }

      await fetchAccountingData()
      setNewIncome({ amount: '', description: '', source: 'manual' })
      setShowIncomeForm(false)
      alert('収入を追加しました')
    } catch (error) {
      console.error('収入追加エラー:', error)
      alert('収入の追加中にエラーが発生しました')
    }
  }

  const handleAddOverallIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!overallIncomeAmount || !overallIncomeDesc) {
      alert('金額と説明を入力してください')
      return
    }
    try {
      const amount = parseInt(overallIncomeAmount)
      const { error } = await supabase
        .from('incomes')
        .insert({
          amount,
          description: overallIncomeDesc,
          source: 'overall'
        })
      if (error) {
        console.error('全体収入追加エラー:', error)
        alert('全体収入の追加に失敗しました')
        return
      }
      await fetchAccountingData()
      setShowOverallIncomeForm(false)
      setOverallIncomeAmount('')
      setOverallIncomeDesc('')
      alert('全体残高に収入を追加しました')
    } catch (error) {
      console.error('全体収入追加エラー:', error)
      alert('全体収入の追加中にエラーが発生しました')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">データを読み込み中...</div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">経理管理</h1>
            <p className="text-gray-600 mt-2">売上・利益・支出の管理</p>
          </div>

          {/* 利益計算カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">総売上</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(profitData.totalRevenue)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">総原価</h3>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(profitData.totalCost)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">総利益</h3>
              <p className={`text-2xl font-bold ${profitData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profitData.totalProfit)}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">利益率</h3>
              <p className={`text-2xl font-bold ${profitData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitData.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* 残高管理カード */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">残高管理</h2>
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                支出を追加
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">現在の残高</h3>
                <p className={`text-3xl font-bold ${balanceData.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balanceData.currentBalance)}
                </p>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">総収入</h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(balanceData.totalIncome)}
                </p>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">総支出</h3>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(balanceData.totalExpenses)}
                </p>
              </div>
            </div>

            {/* 収入追加フォーム */}
            <div className="mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowIncomeForm(!showIncomeForm)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  収入を追加
                </button>
                <button
                  onClick={() => setShowOverallIncomeForm(!showOverallIncomeForm)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  残高(全体)を追加
                </button>
              </div>
              {showIncomeForm && (
                <div className="border-t pt-6 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">新しい収入を追加</h3>
                  <form onSubmit={handleAddIncome} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                      <input
                        type="number"
                        value={newIncome.amount}
                        onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="金額を入力"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
                      <select
                        value={newIncome.source}
                        onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="manual">手入力</option>
                        <option value="deposit">チャージ</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                      <input
                        type="text"
                        value={newIncome.description}
                        onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="収入の詳細を入力"
                        required
                      />
                    </div>
                    <div className="md:col-span-4 flex gap-2">
                      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">追加</button>
                      <button type="button" onClick={() => setShowIncomeForm(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">キャンセル</button>
                    </div>
                  </form>
                </div>
              )}
              {showOverallIncomeForm && (
                <div className="border-t pt-6 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">全体残高に収入を追加</h3>
                  <form onSubmit={handleAddOverallIncome} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                      <input
                        type="number"
                        value={overallIncomeAmount}
                        onChange={(e) => setOverallIncomeAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="金額を入力"
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                      <input
                        type="text"
                        value={overallIncomeDesc}
                        onChange={(e) => setOverallIncomeDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="収入の詳細を入力"
                        required
                      />
                    </div>
                    <div className="md:col-span-4 flex gap-2">
                      <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">追加</button>
                      <button type="button" onClick={() => setShowOverallIncomeForm(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">キャンセル</button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* 支出追加フォーム */}
            {showExpenseForm && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">新しい支出を追加</h3>
                <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      金額
                    </label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="金額を入力"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ
                    </label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="研究室物品">研究室物品</option>
                      <option value="設備費">設備費</option>
                      <option value="消耗品">消耗品</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="支出の詳細を入力"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-4 flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      追加
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 収入履歴 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">収入履歴（手入力 + チャージ合算）</h2>
            {incomes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">収入履歴がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">説明</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {incomes.map((income) => (
                      <tr key={income.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(income.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{income.source}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{income.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">{formatCurrency(income.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 支出履歴 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">支出履歴</h2>
            
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">支出履歴がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        カテゴリ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        説明
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        金額
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(expense.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
