'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

interface PurchaseItem {
  product: { _id: string; name: string }
  quantity: number
  price: number
  total: number
}

interface Purchase {
  _id: string
  purchaseOrderNumber: string
  supplier: { _id: string; companyName: string }
  brand: { _id: string; name: string }
  items: PurchaseItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  paymentStatus: string
  notes?: string
  createdAt: string
}

export function PurchaseDetail({ purchaseId }: { purchaseId: string }) {
  const router = useRouter()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPurchase = useCallback(async () => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`)
      const json = await res.json()
      if (json.data) setPurchase(json.data)
    } catch {
      toast.error('Failed to load purchase')
    } finally {
      setLoading(false)
    }
  }, [purchaseId])

  useEffect(() => { fetchPurchase() }, [fetchPurchase])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this purchase? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Purchase deleted')
      router.push('/purchases')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete purchase')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Purchase not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/purchases')}>Back to Purchases</Button>
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
            <h1 className="text-2xl font-bold">{purchase.purchaseOrderNumber}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(purchase.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/purchases/${purchase._id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </a>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Supplier</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{purchase.supplier?.companyName || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Brand</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium">{purchase.brand?.name || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Payment Status</CardTitle></CardHeader>
          <CardContent>
            <Badge className={getStatusColor(purchase.paymentStatus)}>{purchase.paymentStatus}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{item.product?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell className="text-right text-muted-foreground">Subtotal</TableCell>
                <TableCell className="text-right">{formatCurrency(purchase.subtotal)}</TableCell>
              </TableRow>
              {purchase.discount > 0 && (
                <TableRow>
                  <TableCell colSpan={3} />
                  <TableCell className="text-right text-muted-foreground">Discount</TableCell>
                  <TableCell className="text-right text-destructive">-{formatCurrency(purchase.discount)}</TableCell>
                </TableRow>
              )}
              {purchase.shipping > 0 && (
                <TableRow>
                  <TableCell colSpan={3} />
                  <TableCell className="text-right text-muted-foreground">Shipping</TableCell>
                  <TableCell className="text-right">{formatCurrency(purchase.shipping)}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell className="text-right font-bold">Total</TableCell>
                <TableCell className="text-right font-bold text-lg">{formatCurrency(purchase.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {purchase.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
