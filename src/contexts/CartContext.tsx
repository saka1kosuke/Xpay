'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { Product } from '@/lib/supabase'

interface CartItem {
  product: Product
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
  isCheckoutComplete: boolean
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; payload: CartState }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.product.id === action.payload.id)
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          total: state.total + action.payload.sell_price,
        }
      }
      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
        total: state.total + action.payload.sell_price,
      }
    }
    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.product.id === action.payload)
      if (!itemToRemove) return state
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload),
        total: state.total - (itemToRemove.product.sell_price * itemToRemove.quantity),
      }
    }
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      const item = state.items.find(item => item.product.id === productId)
      if (!item) return state
      
      const quantityDiff = quantity - item.quantity
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
        total: state.total + (item.product.sell_price * quantityDiff),
      }
    }
    case 'CLEAR_CART':
      console.log('カートをクリア中、isCheckoutCompleteをtrueに設定')
      return {
        items: [],
        total: 0,
        isCheckoutComplete: true,
      }
    case 'HYDRATE':
      console.log('カート状態を復元中:', action.payload)
      return action.payload
    default:
      return state
  }
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    isCheckoutComplete: false,
  })

  // 初期化時にlocalStorageから復元
  useEffect(() => {
    const savedCart = localStorage.getItem('xpay_cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: 'HYDRATE', payload: parsedCart })
      } catch (error) {
        console.error('カート状態の復元に失敗しました:', error)
      }
    }
  }, [])

  // 状態更新時にlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('xpay_cart', JSON.stringify(state))
  }, [state])

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
