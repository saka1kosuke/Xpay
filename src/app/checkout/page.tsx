'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase, Product, User } from '@/lib/supabase'

export default function CheckoutPage() {
  const { state, dispatch } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('ユーザー情報取得エラー:', error)
          } else {
            setCurrentUser(data)
          }
        } catch (error) {
          console.error('ユーザー情報取得エラー:', error)
        }
      }
      setLoading(false)
    }

    fetchUserInfo()
  }, [user?.id])

  // useEffectを使用してリダイレクトを処理
  useEffect(() => {
    if (state.items.length === 0) {
      router.push('/cart')
    }
  }, [state.items.length, router])

  // ローディング中またはカートが空の場合は何も表示しない
  if (loading || state.items.length === 0) {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      )
    }
    return null
  }

  const total = state.items.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      console.log('=== 決済処理開始 ===')
      console.log('カート内の商品:', state.items)
      console.log('ユーザー情報:', user)
      
      if (!user) {
        alert('ユーザー情報が取得できません。ログインし直してください。')
        setIsProcessing(false)
        return
      }

      // 残高チェック
      if (!currentUser || currentUser.balance < total) {
        alert(`残高が不足しています。現在の残高: ¥${currentUser?.balance || 0}, 必要金額: ¥${total}`)
        setIsProcessing(false)
        return
      }

      // 在庫更新処理
      let allUpdatesSuccessful = true
      
      for (const item of state.items) {
        try {
          console.log(`\n--- 商品 ${item.product.name} の在庫更新処理開始 ---`)
          
          // 現在の在庫数を取得
          const { data: currentItem, error: fetchError } = await supabase
            .from('items')
            .select('stock, bought_count, sold_count')
            .eq('id', item.product.id)
            .single()
          
          if (fetchError) {
            console.error(`❌ 商品情報の取得に失敗しました (商品ID: ${item.product.id}):`, fetchError)
            allUpdatesSuccessful = false
            continue
          }
          
          console.log('現在の在庫情報:', currentItem)
          
          // 在庫数と売上数を更新
          const newStock = currentItem.stock - item.quantity
          const newSoldCount = (currentItem.sold_count || 0) + item.quantity
          
          if (newStock < 0) {
            console.error(`❌ 在庫不足 (商品ID: ${item.product.id}): 現在の在庫: ${currentItem.stock}, 要求数量: ${item.quantity}`)
            allUpdatesSuccessful = false
            continue
          }
          
          // 在庫更新を実行
          const { error: updateError } = await supabase
            .from('items')
            .update({
              stock: newStock,
              sold_count: newSoldCount
            })
            .eq('id', item.product.id)
          
          if (updateError) {
            console.error(`❌ 在庫更新に失敗しました (商品ID: ${item.product.id}):`, updateError)
            allUpdatesSuccessful = false
          } else {
            console.log(`✅ 在庫更新成功: 商品ID ${item.product.id}, 新しい在庫数: ${newStock}`)
          }
        } catch (error) {
          console.error(`❌ 在庫更新処理でエラーが発生しました (商品ID: ${item.product.id}):`, error)
          allUpdatesSuccessful = false
        }
      }
      
      console.log('在庫更新完了, 成功:', allUpdatesSuccessful)

      if (allUpdatesSuccessful) {
        try {
          // ユーザーの残高を更新
          console.log('ユーザーの残高を更新中...')
          const newBalance = currentUser.balance - total
          const { error: balanceError } = await supabase
            .from('users')
            .update({ 
              balance: newBalance,
              total_withdraw: (currentUser.total_withdraw || 0) + total
            })
            .eq('id', user.id)

          if (balanceError) {
            console.error('残高更新に失敗しました:', balanceError)
            alert('残高更新に失敗しました。もう一度お試しください。')
            setIsProcessing(false)
            return
          }

          console.log('残高更新成功:', newBalance)

          // 取引履歴を作成
          console.log('取引履歴を作成中...')
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              type: 'purchase',
              amount: total,
              description: `商品購入: ${state.items.map(item => `${item.product.name}×${item.quantity}`).join(', ')}`
            })

          if (transactionError) {
            console.error('取引履歴作成に失敗しました:', transactionError)
            // 取引履歴の作成に失敗しても購入は完了とする
          } else {
            console.log('取引履歴作成成功')
          }

          console.log('決済処理完了、カートをクリア中...')
          
          // カートをクリア
          dispatch({ type: 'CLEAR_CART' })
          
          console.log('カートクリア完了、リダイレクト中...')
          
          // カート画面にリダイレクト（決済完了メッセージを表示するため）
          setTimeout(() => {
            router.push('/cart')
          }, 100)
          
        } catch (error) {
          console.error('決済処理に失敗しました:', error)
          alert('決済処理に失敗しました。もう一度お試しください。')
          setIsProcessing(false)
        }
      } else {
        // 在庫更新に失敗した場合
        alert('在庫更新に失敗しました。もう一度お試しください。')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('決済処理に失敗しました:', error)
      alert('決済処理に失敗しました。もう一度お試しください。')
      setIsProcessing(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">チェックアウト</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 注文サマリー */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">注文サマリー</h2>
              
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-4 py-3 border-b border-gray-200">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-sm">
                        📦
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">数量: {item.quantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">¥{item.product.sell_price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">合計:</span>
                  <span className="text-2xl font-bold text-blue-600">¥{total}</span>
                </div>
              </div>
            </div>

                         {/* 決済情報 */}
             <div className="bg-white rounded-lg shadow p-6">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">決済情報</h2>
               
               <div className="space-y-4">
                                   <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">現在の残高</h3>
                    <p className="text-2xl font-bold text-blue-600">¥{currentUser?.balance || 0}</p>
                  </div>
                 
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <h3 className="font-medium text-gray-900 mb-2">決済金額</h3>
                   <p className="text-2xl font-bold text-gray-900">¥{total}</p>
                 </div>
                 
                                   {currentUser && currentUser.balance < total && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-red-600 font-medium">
                        ❌ 残高が不足しています。入金が必要です。
                      </p>
                    </div>
                  )}
                 
                 <form onSubmit={handleSubmit} className="space-y-4">
                                       <button
                      type="submit"
                      disabled={isProcessing || !currentUser || currentUser.balance < total}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isProcessing ? '処理中...' : `¥${total} で決済する`}
                    </button>
                 </form>
                 
                 {isProcessing && (
                   <div className="mt-4 text-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                     <p className="text-sm text-gray-600">決済処理中です...</p>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
