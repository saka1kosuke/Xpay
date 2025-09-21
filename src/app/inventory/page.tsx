'use client'

import React, { useState, useEffect } from 'react'
import { Product, supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [purchaseHistory, setPurchaseHistory] = useState<Array<{ id: string; created_at: string; user_id: string; amount: number; description?: string | null }>>([])

  useEffect(() => {
    fetchProducts()
    fetchPurchaseHistory()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('商品の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'purchase')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchaseHistory((data as any[]) || [])
    } catch (error) {
      console.error('購入履歴の取得に失敗しました:', error)
    }
  }

  const handleSaveProduct = async (updatedProduct: Product) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({
          name: updatedProduct.name,
          buy_price: updatedProduct.buy_price,
          sell_price: updatedProduct.sell_price,
          stock: updatedProduct.stock,
        })
        .eq('id', updatedProduct.id)

      if (error) throw error
      await fetchProducts()
      setEditingProduct(null)
    } catch (error) {
      console.error('商品の更新に失敗しました:', error)
    }
  }

  const handleAddProduct = async (newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'bought_count' | 'sold_count' | 'created_by' | 'image' | 'image_url' | 'description' | 'category'> & { expiry_date?: string }) => {
    try {
      const { error } = await supabase
        .from('items')
        .insert({
          name: newProduct.name,
          buy_price: newProduct.buy_price,
          sell_price: newProduct.sell_price,
          stock: newProduct.stock,
          expiry_date: newProduct.expiry_date || null,
        })

      if (error) throw error
      await fetchProducts()
      setShowAddForm(false)
    } catch (error) {
      console.error('商品の追加に失敗しました:', error)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">在庫管理</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              商品追加
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    買値
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    売値
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    在庫
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">
                              📦
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{product.buy_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{product.sell_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10
                          ? 'bg-green-100 text-green-800'
                          : product.stock > 5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}個
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 購入履歴 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">購入履歴</h2>
            </div>
            <div className="overflow-x-auto">
              {purchaseHistory.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">購入履歴がありません</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">説明</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseHistory.map((r) => {
                      let dt: string
                      try {
                        dt = new Date(r.created_at).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
                      } catch {
                        dt = r.created_at
                      }
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dt}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.user_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{r.description || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">¥{r.amount}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 商品追加フォーム */}
          {showAddForm && (
            <AddProductForm
              onSubmit={handleAddProduct}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* 商品編集フォーム */}
          {editingProduct && (
            <EditProductForm
              product={editingProduct}
              onSubmit={handleSaveProduct}
              onCancel={() => setEditingProduct(null)}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

// 商品追加フォームコンポーネント
function AddProductForm({ onSubmit, onCancel }: {
  onSubmit: (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'bought_count' | 'sold_count' | 'created_by' | 'image' | 'image_url' | 'description' | 'category'> & { expiry_date?: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [stock, setStock] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      buy_price: parseInt(buyPrice),
      sell_price: parseInt(sellPrice),
      stock: parseInt(stock),
      expiry_date: expiryDate || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">商品追加</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">商品名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">買値</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">売値</label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">在庫数</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">消費期限</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 商品編集フォームコンポーネント
function EditProductForm({ product, onSubmit, onCancel }: {
  product: Product
  onSubmit: (product: Product) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(product.name)
  const [buyPrice, setBuyPrice] = useState(product.buy_price.toString())
  const [sellPrice, setSellPrice] = useState(product.sell_price.toString())
  const [stock, setStock] = useState(product.stock.toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...product,
      name,
      buy_price: parseInt(buyPrice),
      sell_price: parseInt(sellPrice),
      stock: parseInt(stock),
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">商品編集</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">商品名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">買値</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">売値</label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">在庫数</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
