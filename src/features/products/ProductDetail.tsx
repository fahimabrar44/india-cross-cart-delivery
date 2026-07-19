'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

interface Product {
  _id: string
  name: string
  sku: string
  barcode?: string
  category: { _id: string; name: string }
  brand: { _id: string; name: string }
  description?: string
  purchasePrice: number
  sellingPrice: number
  images: string[]
  stockAlertLimit: number
  createdAt: string
  updatedAt: string
}

export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}`)
      const json = await res.json()
      if (json.data) setProduct(json.data)
    } catch {
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => { fetchProduct() }, [fetchProduct])

  async function handleDelete() {
    if (!confirm('Are you sure?')) return
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Product deleted')
      router.push('/products')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/products')}>Back to Products</Button>
      </div>
    )
  }

  const profit = product.sellingPrice - product.purchasePrice
  const margin = product.sellingPrice > 0 ? (profit / product.sellingPrice) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/products/${productId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Brand</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{product.brand?.name || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Category</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{product.category?.name || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Stock Alert</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{product.stockAlertLimit > 0 ? product.stockAlertLimit : 'Not set'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selling Price</span>
              <span className="font-medium text-lg">{formatCurrency(product.sellingPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Price</span>
              <span className="font-medium">{formatCurrency(product.purchasePrice)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit</span>
              <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margin</span>
              <span className="font-medium">{margin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU</span>
              <span className="font-mono">{product.sku}</span>
            </div>
            {product.barcode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barcode</span>
                <span className="font-mono">{product.barcode}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(product.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(product.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {product.description && (
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {product.images && product.images.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Images ({product.images.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
