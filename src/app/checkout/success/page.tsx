'use client'

import React from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function CheckoutSuccessPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            決済完了
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            ご注文ありがとうございました。<br />
            商品は研究室で受け取りください。
          </p>
          
          <div className="space-y-4">
            <Link
              href="/products"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors duration-200 block"
            >
              商品一覧に戻る
            </Link>
            
            <Link
              href="/"
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-300 transition-colors duration-200 block"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
