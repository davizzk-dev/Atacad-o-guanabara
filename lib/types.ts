import type { Session } from "next-auth"

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image?: string
  category: string
  description: string
  stock: number
  // Sistema de avaliações removido
  isOnSale?: boolean
  discount?: number
  isFavorite?: boolean
  tags?: string[]
  brand?: string
  unit?: string
  inStock?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  reference?: string
}

export interface ShippingCalculation {
  distance: number // em km
  duration: number // em minutos
  cost: number // em reais
  estimatedDelivery: string // tempo estimado
  available: boolean
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  customerInfo: {
    name: string
    email: string
    phone: string
    address: Address
  }
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled"
  createdAt: Date
  estimatedDelivery?: Date
  paymentMethod?: string
  notes?: string
  shippingCost?: number
  shippingDistance?: number
}

export interface User {
  id: string
  email: string
  name: string
  phone: string
  address?: Address
  role: "user" | "admin"
  createdAt?: string
  updatedAt?: string
  orders?: number
  totalSpent?: number
  lastOrder?: string | null
  isClient?: boolean
}

export interface Promotion {
  id: string
  title: string
  description: string
  discount: number
  validUntil: Date
  image: string
  isActive: boolean
}

export interface ProductPromotion {
  id: string
  productId: string
  productName: string
  originalPrice: number
  newPrice: number
  discount: number
  image: string
  isActive: boolean
  createdAt: Date
  validUntil?: Date
}



// Extensões para NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }
  
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
  }
}
