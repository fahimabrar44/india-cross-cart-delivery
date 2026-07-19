'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface InventoryDetailData {
  _id: string
  product: { _id: string; name: string; sku: string }
  warehouse: { _id: string; name: string }
  brand: { _id: string; name: string }
  currentStock: number
  openingStock: number
  createdAt: string
}

function getStatus(currentStock: number): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (currentStock <= 0) return { label: 'Out of Stock', variant: 'destructive' }
  if (currentStock < 10) return { label: 'Low Stock', variant: 'secondary' }
  return { label: 'In Stock', variant: 'default' }
}

export function InventoryDetail({ inventoryId }: { inventoryId: string }) {
  const router = useRouter()
  const [data, setData] = useState<InventoryDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchData()
  }, [inventoryId])

  async function fetchData() {
    try {
      const res = await fetch(`/api/inventory/${inventoryId}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch inventory')
      const json = await res.json()
      setData(json.data)
    } catch {
      toast.error('Failed to fetch inventory details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/inventory')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inventory Record Not Found</h2>
            <p className="text-muted-foreground mb-4">The inventory record you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button onClick={() => router.push('/inventory')}>Go to Inventory</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = getStatus(data.currentStock)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/inventory')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{data.product?.name || 'Unknown Product'}</CardTitle>
              <Badge className="mt-1" variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Product Name</h3>
              <p>{data.product?.name || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">SKU</h3>
              <p className="font-mono">{data.product?.sku || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Warehouse</h3>
              <p>{data.warehouse?.name || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Brand</h3>
              <p>{data.brand?.name || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Quantity</h3>
              <p className="text-2xl font-bold">{data.currentStock}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Opening Stock</h3>
              <p>{data.openingStock}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
              <p>{formatDate(data.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
