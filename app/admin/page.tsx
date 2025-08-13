'use client'

import { useState } from 'react'
import {
  Bell,
  LogOut,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  MessageCircle,
  Camera,
  RotateCcw,
  Globe,
  Tag,
  ImageIcon,
  Settings,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

export default function AdminPage() {
  const { status } = useSession()
  const [activeTab, setActiveTab] = useState(
    'dashboard' as
      | 'dashboard'
      | 'products'
      | 'orders'
      | 'users'
      | 'feedback'
      | 'camera-requests'
      | 'returns'
      | 'varejo-facil'
      | 'promotions'
      | 'site-images'
      | 'settings'
  )

  const safeStats = {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingCameraRequests: 0,
    pendingFeedback: 0,
    pendingReturns: 0,
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </button>
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              <SidebarButton icon={BarChart3} label="Dashboard" tab="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={Package} label="Produtos" tab="products" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={ShoppingCart} label="Pedidos" tab="orders" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={Users} label="Usuários" tab="users" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={MessageCircle} label="Feedbacks" tab="feedback" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={Camera} label="Câmeras" tab="camera-requests" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={RotateCcw} label="Trocas/Devoluções" tab="returns" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={Globe} label="Varejo Fácil" tab="varejo-facil" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={Tag} label="Promoções" tab="promotions" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={ImageIcon} label="Imagens do Site" tab="site-images" activeTab={activeTab} setActiveTab={setActiveTab} />
              <SidebarButton icon={Settings} label="Configurações" tab="settings" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total de Usuários" value={safeStats.totalUsers} icon={<Users className="h-8 w-8 text-blue-600" />} />
                  <StatCard title="Total de Produtos" value={safeStats.totalProducts} icon={<Package className="h-8 w-8 text-green-600" />} />
                  <StatCard title="Total de Pedidos" value={safeStats.totalOrders} icon={<ShoppingCart className="h-8 w-8 text-orange-600" />} />
                  <StatCard title="Solicitações de Câmera" value={safeStats.pendingCameraRequests} icon={<Camera className="h-8 w-8 text-purple-600" />} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SimpleCard title="Feedbacks Pendentes" value={safeStats.pendingFeedback} />
                  <SimpleCard title="Trocas/Devoluções Pendentes" value={safeStats.pendingReturns} />
                  <SimpleCard title="Status do Sistema" value="OK" />
                </div>
              </div>
            )}

            {activeTab !== 'dashboard' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {labelForTab(activeTab)}
                </h2>
                <p className="text-gray-600">Seção em construção. Em breve adicionaremos as funcionalidades completas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SidebarButton({ icon: Icon, label, tab, activeTab, setActiveTab }: {
  icon: any
  label: string
  tab: string
  activeTab: string
  setActiveTab: (t: any) => void
}) {
  const active = activeTab === tab
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-4 w-4 mr-3" />
      {label}
    </button>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{String(value)}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}

function SimpleCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{String(value)}</p>
    </div>
  )
}

function labelForTab(tab: string) {
  switch (tab) {
    case 'products':
      return 'Produtos'
    case 'orders':
      return 'Pedidos'
    case 'users':
      return 'Usuários'
    case 'feedback':
      return 'Feedbacks'
    case 'camera-requests':
      return 'Solicitações de Câmera'
    case 'returns':
      return 'Trocas e Devoluções'
    case 'varejo-facil':
      return 'Varejo Fácil'
    case 'promotions':
      return 'Promoções'
    case 'site-images':
      return 'Imagens do Site'
    case 'settings':
      return 'Configurações'
    default:
      return 'Seção'
  }
}