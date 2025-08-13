"use client"


import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { products } from "@/lib/data"
import { useCartStore, useFavoritesStore } from "@/lib/store"
import { Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, Check, ArrowLeft } from "lucide-react"
// Note: using native <img> and <a> to avoid type issues across workspaces
 

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Heart, ShoppingCart, Minus, Plus, Share2, Star, Package, Barcode, Hash, Eye, TrendingDown, Calculator } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { useCartStore, useFavoritesStore } from "@/lib/store"
import { ProductCard } from "@/components/product-card"

interface PriceData {
  id: number
  precoVenda1: number
  precoOferta1: number
  precoVenda2: number
  precoOferta2: number
  quantidadeMinimaPreco2: number
  precoVenda3: number
  precoOferta3: number
  quantidadeMinimaPreco3: number
  descontoMaximo: number
  permiteDesconto: boolean
}

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [priceData, setPriceData] = useState<PriceData | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  const [showAddAnimation, setShowAddAnimation] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [whatsNumber, setWhatsNumber] = useState<string | null>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(0)
  const confettiRef = useRef<HTMLCanvasElement | null>(null)


  const { addItem, items } = useCartStore()
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore()

  // Carrega número do WhatsApp de settings via API
  useEffect(() => {
    let mounted = true
    if (!whatsNumber) {
      fetch('/api/settings')
        .then((r) => r.json())
        .then((s) => {
          if (mounted && s?.whatsapp_number) setWhatsNumber(String(s.whatsapp_number))
        })
        .catch(() => {})
    }
    return () => { mounted = false }
  }, [whatsNumber])

  if (!product) {

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        console.log('🔍 Buscando produto ID:', productId)
        
        // Buscar produtos reais da API Varejo Fácil (via API route)
        console.log('🌐 Fazendo requisição para /api/products...')
        const response = await fetch(`/api/products`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        console.log('📡 Status da resposta:', response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('📊 Dados recebidos da API:')
        console.log('   - Tipo de dados:', typeof data)
        console.log('   - É array?', Array.isArray(data))
        console.log('   - Tem products?', !!data.products)
        console.log('   - Total de produtos:', Array.isArray(data.products) ? data.products.length : Array.isArray(data) ? data.length : 'N/A')
        console.log('   - Product ID procurado:', productId, '(tipo:', typeof productId, ')')
        console.log('   - Dados completos:', data)
        
        // A API /api/products retorna array direto de produtos
        if (!Array.isArray(data)) {
          console.error('❌ API não retornou array:', typeof data)
          console.error('   - Dados recebidos:', data)
          throw new Error('API deve retornar array de produtos')
        }
        
        const products: Product[] = data
        console.log('✅ Array de produtos recebido diretamente da API')
        
        if (products.length === 0) {
          console.warn('⚠️ Array de produtos está vazio!')
          console.warn('   - Isso pode indicar que o arquivo products.json não foi carregado corretamente')
          console.warn('   - Ou que há um problema no cache do Next.js')
        }
        
        console.log(`📦 Total de produtos carregados: ${products.length}`)
        
        // Buscar produto pelos dados reais do Varejo Fácil
        console.log('🔍 Iniciando busca do produto...')
        console.log('   - IDs dos primeiros 5 produtos:', products.slice(0, 5).map(p => `${p.id} (${typeof p.id})`))
        
        const foundProduct = products.find((p: Product) => {
          const match1 = p.id.toString() === productId
          const match2 = p.id === productId
          const match3 = String(p.id) === String(productId)
          
          if (match1 || match2 || match3) {
            console.log(`✅ PRODUTO ENCONTRADO! Produto ID ${p.id} combina com busca ${productId}`)
            console.log(`   - Match toString: ${match1}`)
            console.log(`   - Match direto: ${match2}`)
            console.log(`   - Match String(): ${match3}`)
            return true
          }
          return false
        })
        
        console.log('🎯 Resultado da busca:', foundProduct ? 'PRODUTO ENCONTRADO' : 'PRODUTO NÃO ENCONTRADO')
        
        if (foundProduct) {
          console.log('✅ Produto real encontrado:', {
            id: foundProduct.id,
            name: foundProduct.name,
            price: foundProduct.price,
            category: foundProduct.category
          })
          setProduct(foundProduct)
          setCurrentPrice(foundProduct.price)
          
          // Verificar se o produto tem preços escalonados reais
          let hasScaledPrices = false
          
          // Verificar se tem preços escalonados no formato do Varejo Fácil
          if (foundProduct.prices && foundProduct.prices.minQuantityPrice2 && foundProduct.prices.minQuantityPrice2 > 1) {
            const prices = foundProduct.prices
            console.log('🏷️ PRODUTO COM PREÇOS ESCALONADOS ENCONTRADO!', {
              id: foundProduct.id,
              name: foundProduct.name,
              prices: prices
            })
            setPriceData({
              id: 0,
              precoVenda1: prices.price1 || foundProduct.price,
              precoOferta1: prices.offerPrice1 || 0,
              precoVenda2: prices.price2 || 0,
              precoOferta2: prices.offerPrice2 || 0,
              quantidadeMinimaPreco2: prices.minQuantityPrice2 || 0,
              precoVenda3: prices.price3 || 0,
              precoOferta3: prices.offerPrice3 || 0,
              quantidadeMinimaPreco3: prices.minQuantityPrice3 || 0,
              descontoMaximo: 0,
              permiteDesconto: false
            })
            hasScaledPrices = true
            console.log('💰 Usando preços escalonados do Varejo Fácil:', prices)
          } else {
            console.log('❌ PRODUTO SEM PREÇOS ESCALONADOS', {
              id: foundProduct.id,
              name: foundProduct.name,
              hasPrices: !!foundProduct.prices,
              minQuantity: foundProduct.prices?.minQuantityPrice2,
              prices: foundProduct.prices
            })
          }
          
          // Fallback: Usar preços escalonados se disponíveis nos dados sincronizados E válidos
          if (!hasScaledPrices && (foundProduct as any).scaledPrices) {
            const scaledPrices = (foundProduct as any).scaledPrices
            // Só considera como preços escalonados se realmente há uma quantidade mínima para preço 2
            if (scaledPrices.price2?.quantidadeMinima && scaledPrices.price2.quantidadeMinima > 1) {
              setPriceData({
                id: 0,
                precoVenda1: scaledPrices.price1.precoVenda,
                precoOferta1: scaledPrices.price1.precoOferta,
                precoVenda2: scaledPrices.price2.precoVenda,
                precoOferta2: scaledPrices.price2.precoOferta,
                quantidadeMinimaPreco2: scaledPrices.price2.quantidadeMinima,
                precoVenda3: scaledPrices.price3?.precoVenda || 0,
                precoOferta3: scaledPrices.price3?.precoOferta || 0,
                quantidadeMinimaPreco3: scaledPrices.price3?.quantidadeMinima || 0,
                descontoMaximo: scaledPrices.descontoMaximo || 0,
                permiteDesconto: scaledPrices.permiteDesconto || false
              })
              hasScaledPrices = true
              console.log('💰 Usando preços escalonados dos dados sincronizados:', scaledPrices)
            }
          }
          
          // Se não tem preços escalonados sincronizados, buscar da API como fallback
          if (!hasScaledPrices) {
            try {
              const pricesResponse = await fetch(`/api/product-prices?q=produtoId==${foundProduct.id}`, {
                cache: 'no-store'
              })
              
              if (pricesResponse.ok) {
                const pricesData = await pricesResponse.json()
                if (pricesData.success && pricesData.data?.items?.length > 0) {
                  const priceInfo = pricesData.data.items[0]
                  // Só usar se realmente há quantidade mínima para preço 2
                  if (priceInfo.quantidadeMinimaPreco2 && priceInfo.quantidadeMinimaPreco2 > 1) {
                    setPriceData(priceInfo)
                    console.log('💰 Preços escalonados encontrados via API:', priceInfo)
                  } else {
                    console.log('ℹ️ Produto não possui preços escalonados válidos via API')
                  }
                } else {
                  console.log('ℹ️ Nenhum preço escalonado encontrado via API')
                }
              }
            } catch (error) {
              console.log('⚠️ Erro ao buscar preços escalonados:', error)
            }
          }
          
          // Se não encontrou preços escalonados válidos, garantir que priceData seja null
          if (!hasScaledPrices) {
            console.log('ℹ️ Produto possui preço único (sem preços escalonados)')
          }
          
          // Buscar produtos relacionados da mesma categoria (dados reais)
          const related = products
            .filter((p: Product) => 
              p.category === foundProduct.category && 
              p.id !== foundProduct.id
            )
            .slice(0, 8)
          setRelatedProducts(related)
          console.log(`📦 Produtos relacionados encontrados: ${related.length}`)
        } else {
          console.log('❌ Produto não encontrado no banco de dados do Varejo Fácil')
          // Lista os primeiros 5 IDs para debug
          const firstFiveIds = products.slice(0, 5).map(p => p.id)
          console.log('🔍 Primeiros 5 IDs no banco:', firstFiveIds)
          
          setProduct(null) // Não criar produtos fake - produto realmente não existe
        }
      } catch (error) {
        console.error('❌ Erro ao buscar produto:', error)
        setProduct(null) // Em caso de erro, não mostrar produto fake
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  // Calcular preço baseado na quantidade
  useEffect(() => {
    if (!product) return

    let newPrice = product.price
    
    // Só usar preços escalonados se realmente existirem e forem válidos
    if (priceData && priceData.quantidadeMinimaPreco2 && priceData.quantidadeMinimaPreco2 > 1) {
      // Verificar se quantidade atinge preço 3
      if (priceData.quantidadeMinimaPreco3 && priceData.quantidadeMinimaPreco3 > 1 && quantity >= priceData.quantidadeMinimaPreco3) {
        newPrice = priceData.precoOferta3 || priceData.precoVenda3 || product.price
      }
      // Verificar se quantidade atinge preço 2
      else if (quantity >= priceData.quantidadeMinimaPreco2) {
        newPrice = priceData.precoOferta2 || priceData.precoVenda2 || product.price
      }
      // Usar preço padrão (preço 1) 
      else {
        newPrice = priceData.precoOferta1 || priceData.precoVenda1 || product.price
      }
    } else {
      // Produto sem preços escalonados - usar preço único
      newPrice = product.price
    }

    setCurrentPrice(newPrice)
  }, [quantity, priceData, product])

  const handleAddToCart = async () => {
    if (!product) return
    setIsAdding(true)
    // pequena animação de loading
    await new Promise((r) => setTimeout(r, 250))
    for (let i = 0; i < quantity; i++) addItem(product)
    setIsAdding(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 1600)
    // confetti simples
    try {
      const canvas = confettiRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')!
        const w = (canvas.width = window.innerWidth)
        const h = (canvas.height = 180)
        const pieces = Array.from({ length: 60 }, () => ({
          x: Math.random() * w,
          y: Math.random() * 0,
          r: 4 + Math.random() * 6,
          c: `hsl(${Math.random() * 50 + 10},90%,55%)`,
          vy: 2 + Math.random() * 3,
          vx: -1 + Math.random() * 2
        }))
        let frames = 0
        const animate = () => {
          frames++
          ctx.clearRect(0, 0, w, h)
          pieces.forEach(p => {
            p.x += p.vx; p.y += p.vy
            ctx.fillStyle = p.c
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
          })
          if (frames < 40) requestAnimationFrame(animate)
          else ctx.clearRect(0, 0, w, h)
        }
        animate()
      }
    } catch {}
  }

  const handleToggleFavorite = () => {
    if (product) {
      if (isFavorite(product.id)) {
        removeFavorite(product.id)
      } else {
        addFavorite(product.id)
      }
    }
  }

  const cartItem = items.find((item) => item.product.id === productId)
  const cartQuantity = cartItem?.quantity || 0

  if (loading) {

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-gray-100">
          <img src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" alt="Atacadão Guanabara" className="w-24 h-24 rounded-xl object-cover" />
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            <p className="text-gray-700 font-semibold">Carregando produto — Atacadão Guanabara</p>
          </div>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Estamos preparando as melhores ofertas para você. Obrigado pela preferência! 🛒✨
          </p>
        </div>
      </div>
    )
  }


  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product)
    }
    
    // Mostrar animação
    setShowAddAnimation(true)
    setShowNotification(true)
    
    // Esconder animação após 2 segundos
    setTimeout(() => {
      setShowAddAnimation(false)
    }, 2000)
    
    // Esconder notificação após 3 segundos
    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  const handleToggleFavorite = () => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id)
    } else {
      addFavorite(product.id)
    }
  }

  const handleShareWhatsApp = () => {
    const price = `R$ ${product.price.toFixed(2)}`
    const unit = product.unit ? ` (${product.unit})` : ""
    const store = "Atacadão Guanabara"
    const productUrl = typeof window !== 'undefined' ? window.location.href : ''
    const text = [
      "🛒 Olá! Gostaria de mais informações e disponibilidade deste produto: ",
      `• Produto: ${product.name}${unit}`,
      product.brand ? `• Marca: ${product.brand}` : null,
      `• Preço: ${price}`,
      product.category ? `• Categoria: ${product.category}` : null,
      productUrl ? `• Link: ${productUrl}` : null,
      "",
      `Agradeço desde já! ${store} 🙏✨`
    ].filter(Boolean).join("\n")

    const phone = whatsNumber || '5585985147067'
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    if (typeof window !== 'undefined') {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Notificação flutuante */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5" />
            <span className="font-medium">Produto adicionado ao carrinho!</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Botão Voltar ao Catálogo */}
        <div className="mb-6">
          <a href="/catalog">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Catálogo
=======
  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 mb-6">Este produto não existe no sistema do Varejo Fácil</p>
          <Link href="/catalog">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao catálogo
>>>>>>> 51c583dc6aed85819b3d4fc1c5ef7f1a58749f03
            </Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Confetti canvas (top overlay) */}
        <canvas ref={confettiRef} className="fixed top-16 left-0 right-0 pointer-events-none z-[70]" style={{ height: 180 }} />
        {/* Header com navegação */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/catalog">
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao catálogo
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              className={`border-2 ${
                isFavorite(product.id)
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'border-gray-300 hover:border-red-300 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
            </Button>
            
            <Button variant="outline" size="icon" className="border-blue-200">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

<<<<<<< HEAD
        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail images would go here */}
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <button
                  key={i}
                  className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? "border-primary" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(i)}
                >
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={`${product.name} ${i + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
=======
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Imagem do produto */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-blue-200">
              <CardContent className="p-8">
                <div className="aspect-square flex items-center justify-center bg-white rounded-lg border-2 border-blue-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
>>>>>>> 51c583dc6aed85819b3d4fc1c5ef7f1a58749f03
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do produto */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-xl text-blue-600 font-semibold">{product.brand}</p>
            </div>

            {/* Preços */}
            <div className="space-y-4">
              {/* Preço Principal */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  {currentPrice > 0 ? (
                    <span className="text-4xl font-bold text-blue-600">
                      R$ {currentPrice.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">
                      Consulte o preço
                    </span>
                  )}
                  
                  {product.originalPrice && product.originalPrice > currentPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        R$ {product.originalPrice.toFixed(2)}
                      </span>
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {Math.round((1 - currentPrice / product.originalPrice) * 100)}% OFF
                      </Badge>
                    </>
                  )}
                </div>

                {/* Mensagem de Preços Escalonados - Visual e Atrativa */}
                {priceData && priceData.quantidadeMinimaPreco2 && priceData.quantidadeMinimaPreco2 > 1 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">💰</span>
                      </div>
                      <h3 className="text-lg font-bold text-green-800">Preços Especiais por Quantidade!</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Preço atual ativo */}
                      <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        quantity < (priceData.quantidadeMinimaPreco2 || 0) 
                          ? 'bg-blue-100 border-2 border-blue-300 shadow-md' 
                          : 'bg-gray-100 border border-gray-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 font-bold">📦</span>
                          <span className="font-semibold text-gray-700">
                            1 - {(priceData.quantidadeMinimaPreco2 || 2) - 1} unidades
                          </span>
                          {quantity < (priceData.quantidadeMinimaPreco2 || 0) && (
                            <Badge className="bg-blue-500 text-white text-xs">ATUAL</Badge>
                          )}
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          R$ {(priceData.precoOferta1 || priceData.precoVenda1 || product.price).toFixed(2)}
                        </span>
                      </div>

                      {/* Preço com desconto - Destaque especial */}
                      <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        quantity >= (priceData.quantidadeMinimaPreco2 || 0) && quantity < (priceData.quantidadeMinimaPreco3 || 999999)
                          ? 'bg-green-100 border-2 border-green-400 shadow-lg transform scale-[1.02]' 
                          : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 hover:shadow-md hover:scale-[1.01] cursor-pointer'
                      }`}
                      onClick={() => priceData.quantidadeMinimaPreco2 && setQuantity(priceData.quantidadeMinimaPreco2)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-bold">🎯</span>
                          <div>
                            <div className="font-semibold text-gray-700">
                              A partir de {priceData.quantidadeMinimaPreco2} unidades
                            </div>
                            <div className="text-xs text-green-700 font-medium">
                              Economia de R$ {((priceData.precoOferta1 || priceData.precoVenda1 || product.price) - (priceData.precoOferta2 || priceData.precoVenda2 || product.price)).toFixed(2)} por unidade!
                            </div>
                          </div>
                          {quantity >= (priceData.quantidadeMinimaPreco2 || 0) && quantity < (priceData.quantidadeMinimaPreco3 || 999999) && (
                            <Badge className="bg-green-500 text-white text-xs animate-pulse">ATIVO</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            R$ {(priceData.precoOferta2 || priceData.precoVenda2 || product.price).toFixed(2)}
                          </div>
                          <div className="text-xs text-green-700">
                            Total: R$ {((priceData.precoOferta2 || priceData.precoVenda2 || product.price) * (priceData.quantidadeMinimaPreco2 || 1)).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Preço com desconto máximo - Se existir */}
                      {priceData.quantidadeMinimaPreco3 && priceData.quantidadeMinimaPreco3 > 1 && (
                        <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                          quantity >= (priceData.quantidadeMinimaPreco3 || 0)
                            ? 'bg-purple-100 border-2 border-purple-400 shadow-lg transform scale-[1.02]' 
                            : 'bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-300 hover:shadow-md hover:scale-[1.01] cursor-pointer'
                        }`}
                        onClick={() => priceData.quantidadeMinimaPreco3 && setQuantity(priceData.quantidadeMinimaPreco3)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-bold">🏆</span>
                            <div>
                              <div className="font-semibold text-gray-700">
                                A partir de {priceData.quantidadeMinimaPreco3} unidades
                              </div>
                              <div className="text-xs text-purple-700 font-medium">
                                Máxima economia: R$ {((priceData.precoOferta1 || priceData.precoVenda1 || product.price) - (priceData.precoOferta3 || priceData.precoVenda3 || product.price)).toFixed(2)} por unidade!
                              </div>
                            </div>
                            {quantity >= (priceData.quantidadeMinimaPreco3 || 0) && (
                              <Badge className="bg-purple-500 text-white text-xs animate-pulse">ATIVO</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              R$ {(priceData.precoOferta3 || priceData.precoVenda3 || product.price).toFixed(2)}
                            </div>
                            <div className="text-xs text-purple-700">
                              Total: R$ {((priceData.precoOferta3 || priceData.precoVenda3 || product.price) * (priceData.quantidadeMinimaPreco3 || 1)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-yellow-800">
                        <span>💡</span>
                        <span className="font-medium">
                          Dica: Clique em qualquer faixa de preço para ajustar automaticamente a quantidade!
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Se não houver preços escalonados, mostrar aviso */}
                {(!priceData || !priceData.quantidadeMinimaPreco2 || priceData.quantidadeMinimaPreco2 <= 1) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <span>ℹ️</span>
                      <span>Este produto possui preço único para qualquer quantidade.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Controles de quantidade e compra */}
            <div className="space-y-6">
              {/* Controle de Quantidade Melhorado */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-800">Selecione a Quantidade:</span>
                  {/* Indicador de economia atual */}
                  {priceData?.quantidadeMinimaPreco2 && quantity >= priceData.quantidadeMinimaPreco2 && (
                    <Badge className="bg-green-500 text-white animate-pulse">
                      🎉 Economia Ativa!
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 p-0 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <div className="w-16 text-center">
                      <div className="text-2xl font-bold text-gray-800">{quantity}</div>
                      <div className="text-xs text-gray-500">unidades</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 p-0 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Botões de quantidade rápida */}
                  <div className="flex gap-2 flex-wrap">
                    {priceData?.quantidadeMinimaPreco2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(priceData.quantidadeMinimaPreco2)}
                        className={`${quantity === priceData.quantidadeMinimaPreco2 ? 'bg-green-100 border-green-400 text-green-700' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                      >
                        {priceData.quantidadeMinimaPreco2}
                      </Button>
                    )}
                    {priceData?.quantidadeMinimaPreco3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(priceData.quantidadeMinimaPreco3)}
                        className={`${quantity === priceData.quantidadeMinimaPreco3 ? 'bg-purple-100 border-purple-400 text-purple-700' : 'border-purple-300 text-purple-600 hover:bg-purple-50'}`}
                      >
                        {priceData.quantidadeMinimaPreco3}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Resumo do preço atual */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Preço unitário atual:</div>
                      <div className="text-lg font-bold text-blue-600">
                        R$ {currentPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total a pagar:</div>
                      <div className="text-2xl font-bold text-green-600">
                        R$ {(currentPrice * quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Economia calculada */}
                  {priceData?.precoVenda1 && currentPrice < priceData.precoVenda1 && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="text-sm text-green-700 font-medium">
                        💰 Você está economizando: R$ {((priceData.precoVenda1 - currentPrice) * quantity).toFixed(2)} ({(((priceData.precoVenda1 - currentPrice) / priceData.precoVenda1) * 100).toFixed(0)}% de desconto)
                      </div>
                    </div>
                  )}
<<<<<<< HEAD
                </Button>

                <Button
                  variant="outline"
                  onClick={handleToggleFavorite}
                  className={`px-6 py-4 ${isFavorite(product.id) ? "text-red-600 border-red-600" : ""}`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite(product.id) ? "fill-current" : ""}`} />
                </Button>

                <Button variant="outline" className="px-6 py-4 bg-transparent" onClick={handleShareWhatsApp} title="Compartilhar no WhatsApp">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Entrega Rápida</p>
                  <p className="text-xs text-gray-600">Em até 2 horas</p>
=======
>>>>>>> 51c583dc6aed85819b3d4fc1c5ef7f1a58749f03
                </div>

                {cartQuantity > 0 && (
                  <div className="mt-3 text-center">
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                      🛒 {cartQuantity} unidades já no carrinho
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={currentPrice === 0 || !product.inStock || isAdding}
                className={`w-full text-white py-3 text-lg font-semibold disabled:bg-gray-400 ${isAdding ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} relative overflow-hidden`}
                size="lg"
              >
                {isAdding ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adicionando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {!product.inStock
                      ? 'Produto fora de estoque'
                      : currentPrice > 0
                      ? `Adicionar ${quantity} ao carrinho - R$ ${(currentPrice * quantity).toFixed(2)}`
                      : 'Preço indisponível'}
                  </span>
                )}
              </Button>

              {showSuccess && (
                <div className="fixed top-20 right-4 z-[80] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in-up">
                  ✅ Produto adicionado ao carrinho
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalhes técnicos do Varejo Fácil */}
        <Card className="mb-8 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalhes do Produto - Varejo Fácil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">ID:</span>
                <span className="font-semibold">{product.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Categoria:</span>
                <span className="font-semibold">{product.category}</span>
              </div>

              {(product as any).varejoFacilData?.codigoInterno && (product as any).varejoFacilData.codigoInterno.trim() && (
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Código Interno:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.codigoInterno.trim()}</span>
                </div>
              )}

<<<<<<< HEAD
              <TabsContent value="details" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Informações que importam para você</h3>
                  <div>
                    <h4 className="font-semibold mb-2">Especificações principais</h4>
                    <ul className="space-y-2 text-gray-700">
                      {product.brand && (
                        <li>
                          <strong>Marca:</strong> {product.brand}
                        </li>
                      )}
                      {product.unit && (
                        <li>
                          <strong>Unidade:</strong> {product.unit}
                        </li>
                      )}
                      {product.category && (
                        <li>
                          <strong>Categoria:</strong> {product.category}
                        </li>
                      )}
                    </ul>
                  </div>
=======
              {(product as any).varejoFacilData?.idExterno && (
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">ID Externo:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.idExterno}</span>
>>>>>>> 51c583dc6aed85819b3d4fc1c5ef7f1a58749f03
                </div>
              )}

              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Unidade:</span>
                <span className="font-semibold">{product.unit}</span>
              </div>

              {(product as any).varejoFacilData?.ean && (
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Código EAN:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.ean}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.pesoBruto && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Peso Bruto:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.pesoBruto} kg</span>
                </div>
              )}

              {(product as any).varejoFacilData?.pesoLiquido && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Peso Líquido:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.pesoLiquido} kg</span>
                </div>
              )}

              {(product as any).varejoFacilData?.altura && (product as any).varejoFacilData?.largura && (product as any).varejoFacilData?.comprimento && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Dimensões (A x L x C):</span>
                  <span className="font-semibold">
                    {(product as any).varejoFacilData.altura} x {(product as any).varejoFacilData.largura} x {(product as any).varejoFacilData.comprimento} cm
                  </span>
                </div>
              )}

              {(product as any).varejoFacilData?.unidadeDeCompra && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Unidade de Compra:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.unidadeDeCompra}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.unidadeDeTransferencia && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Unidade de Transferência:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.unidadeDeTransferencia}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.secaoId && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Seção ID:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.secaoId}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.marcaId && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Marca ID:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.marcaId}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.generoId && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Gênero ID:</span>
                  <span className="font-semibold">{(product as any).varejoFacilData.generoId}</span>
                </div>
              )}

              {(product as any).varejoFacilData?.ativoNoEcommerce !== undefined && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Ativo E-commerce:</span>
                  <span className={`font-semibold ${(product as any).varejoFacilData.ativoNoEcommerce ? 'text-green-600' : 'text-red-600'}`}>
                    {(product as any).varejoFacilData.ativoNoEcommerce ? 'Sim' : 'Não'}
                  </span>
                </div>
              )}

              {(product as any).varejoFacilData?.dataAlteracao && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Última Alteração:</span>
                  <span className="font-semibold">
                    {new Date((product as any).varejoFacilData.dataAlteracao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Produtos relacionados */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Produtos Relacionados da Categoria "{product.category}"
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
