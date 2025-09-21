'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function HomePage() {
  const { user } = useAuth()
  const { state } = useCart()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* ヒーローセクション */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 bg-blue-600 rounded-2xl flex items-center justify-center mb-8">
                <span className="text-white text-4xl font-bold">x</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                研究室内の在庫管理を
                <span className="text-blue-600">シンプルに</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                xPayは研究室内の食べ物や飲み物の在庫を管理し、簡単に購入できるWebアプリケーションです。
                在庫の把握から購入まで、すべてを一元化して管理できます。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  商品一覧を見る
                </Link>
                {user?.role === 'admin' && (
                  <div className="flex space-x-4">
                    <Link
                      href="/inventory"
                      className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors duration-200"
                    >
                      在庫管理
                    </Link>
                    <Link
                      href="/admin/balance"
                      className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-green-600 hover:bg-green-50 transition-colors duration-200"
                    >
                      残高管理
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 機能紹介セクション */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">主な機能</h2>
              <p className="text-lg text-gray-600">xPayでできること</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🛍️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">簡単購入</h3>
                <p className="text-gray-600">商品一覧から簡単にカートに追加し、スムーズに決済できます</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">在庫管理</h3>
                <p className="text-gray-600">管理者は在庫の追加・編集・削除を簡単に行えます</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">ユーザー管理</h3>
                <p className="text-gray-600">メンバーと管理者の役割分けで適切な権限管理ができます</p>
              </div>
            </div>
          </div>
        </div>

        {/* カート状況セクション */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">現在のカート状況</h3>
                {state.items.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-lg text-gray-600">
                      カートに <span className="font-semibold text-blue-600">{state.items.length}</span> 件の商品があります
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Link
                        href="/cart"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                      >
                        カートを確認
                      </Link>
                      <Link
                        href="/checkout"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
                      >
                        チェックアウト
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg text-gray-600">カートは空です</p>
                    <Link
                      href="/products"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                    >
                      商品を見る
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              © 2024 xPay. 研究室内の在庫管理システム
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
