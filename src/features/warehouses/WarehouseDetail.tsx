'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Edit, Trash2, Warehouse } from 'lucide-react'

interface WarehouseData {
  _id: string
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  isActive: boolean
  brand: { _id: string; name: string }
  createdAt: string
}

export function WarehouseDetail({ warehouseId }: { warehouseId: string }) {
  const router = useRouter()
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWarehouse = useCallback(async () => {
    try {
      const res = await fetch(`/api/warehouses/${warehouseId}`)
      const json = await res.json()
      if (json.data) setWarehouse(json.data)
    } catch {
      toast.error('Failed to load warehouse')
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  useEffect(() => { fetchWarehouse() }, [fetchWarehouse])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this warehouse?')) return
    try {
      const res = await fetch(`/api/warehouses/${warehouseId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Warehouse deleted')
      router.push('/warehouses')
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

  if (!warehouse) {
    return (
      <div className="text-center py-20">
        <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Warehouse not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/warehouses')}>Back to Warehouses</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{warehouse.name}</h1>
            <p className="text-sm text-muted-foreground">{warehouse.city}{warehouse.city && warehouse.country ? ', ' : ''}{warehouse.country}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/warehouses/${warehouseId}/edit`)}>
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
            <p className="font-medium">{warehouse.brand?.name || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
              {warehouse.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{formatDate(warehouse.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{warehouse.phone || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{warehouse.email || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right max-w-[200px]">{warehouse.address || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">City</span>
              <span className="font-medium">{warehouse.city || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country</span>
              <span className="font-medium">{warehouse.country || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
