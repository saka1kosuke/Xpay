'use client'

import React from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/lib/supabase'

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { dispatch } = useCart()

  const handleAddToCart = () => {
    if (product.stock > 0) {
      dispatch({ type: 'ADD_ITEM', payload: product })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square bg-gray-200 flex items-center justify-center">
        <div className="text-gray-400 text-4xl">
          📦
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
        {product?.expiry_date && (
          <div className="mb-2 text-sm text-gray-600">
            消費期限: {new Date(product.expiry_date as any).toLocaleDateString('ja-JP')}
          </div>
        )}
        
        {product.category && (
          <div className="mb-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {product.category}
            </span>
          </div>
        )}
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">¥{product.sell_price}</span>
          <span className={`text-sm px-2 py-1 rounded-full ${
            product.stock > 10 ? 'bg-green-100 text-green-800' :
            product.stock > 5 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            在庫: {product.stock}個
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-200 ${
            product.stock > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? 'カートに追加' : '在庫切れ'}
        </button>
      </div>
    </div>
  )
}
