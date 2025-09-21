'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function CartPage() {
  const { state, dispatch } = useCart()

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: productId })
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity: newQuantity } })
    }
  }

  const total = state.items.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0)

  if (state.items.length === 0) {
    console.log('カートが空です。isCheckoutComplete:', state.isCheckoutComplete)
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {state.isCheckoutComplete ? (
              <div className="text-center py-12">
                <div className="text-green-400 text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-green-900 mb-2">決済が完了しました！</h1>
                <p className="text-green-600 mb-6">ご購入ありがとうございます</p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  商品一覧に戻る
                </Link>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🛒</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">カートが空です</h1>
                <p className="text-gray-600 mb-6">商品を追加してカートを満たしましょう</p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  商品一覧を見る
                </Link>
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">ショッピングカート</h1>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">カート内の商品 ({state.items.length}件)</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {state.items.map((item) => (
                <div key={item.product.id} className="px-6 py-4 flex items-center space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-gray-400 text-2xl">📦</div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">単価: ¥{item.product.sell_price}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-medium text-gray-900">¥{item.product.sell_price * item.quantity}</p>
                  </div>
                  
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.product.id })}
                    className="text-red-600 hover:text-red-800"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">合計:</span>
                <span className="text-2xl font-bold text-blue-600">¥{total}</span>
              </div>
              
              <div className="mt-4">
                <Link
                  href="/checkout"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors duration-200 text-center block"
                >
                  チェックアウトに進む
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
