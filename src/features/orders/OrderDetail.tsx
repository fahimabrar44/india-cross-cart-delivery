'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/utils'

interface OrderItem {
  product: string
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

interface ShippingAddress {
  name: string
  phone: string
  address: string
  district: string
  country: string
}

interface Order {
  _id: string
  orderNumber: string
  brand: { _id: string; name: string; currency: string; currencySymbol: string }
  customer: { _id: string; name: string; phone: string; email?: string; address?: string; district?: string }
  agent?: { _id: string; name: string; email: string }
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  codAmount: number
  paidAmount: number
  paymentStatus: string
  status: string
  courierName?: string
  trackingNumber?: string
  dispatchDate?: string
  deliveryDate?: string
  notes?: string
  shippingAddress: ShippingAddress
  createdAt: string
  updatedAt: string
}

const statuses = ['new', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned']

export function OrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const json = await res.json()
      if (json.data) setOrder(json.data)
    } catch {
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  async function updateStatus(status: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      const json = await res.json()
      setOrder(json.data)
      toast.success(`Status updated to ${status}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/orders')}>Back to Orders</Button>
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
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              <div className="flex items-center gap-2">
                <Select
                  value={order.status}
                  onValueChange={(v) => v && updateStatus(v)}
                  disabled={updating}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Payment</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
            </div>
            <p className="text-sm mt-1">
              COD: {formatCurrency(order.codAmount)}
              {order.paidAmount > 0 && <> | Paid: {formatCurrency(order.paidAmount)}</>}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
            <p className="text-sm text-muted-foreground">
              Subtotal: {formatCurrency(order.subtotal)}
              {order.discount > 0 && <> | Discount: -{formatCurrency(order.discount)}</>}
              {order.shipping > 0 && <> | Shipping: {formatCurrency(order.shipping)}</>}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-muted-foreground">{order.customer.phone}</p>
            {order.customer.email && <p className="text-muted-foreground">{order.customer.email}</p>}
            <Separator className="my-2" />
            <p className="font-medium">Shipping Address</p>
            <p className="text-muted-foreground">{order.shippingAddress.name}</p>
            <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
            <p className="text-muted-foreground">{order.shippingAddress.address}</p>
            <p className="text-muted-foreground">{order.shippingAddress.district}, {order.shippingAddress.country}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Shipping Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Courier</span>
              <span>{order.courierName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking</span>
              <span>{order.trackingNumber || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dispatch Date</span>
              <span>{order.dispatchDate ? formatDate(order.dispatchDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Date</span>
              <span>{order.deliveryDate ? formatDate(order.deliveryDate) : '-'}</span>
            </div>
            {order.agent && (
              <>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent</span>
                  <span>{order.agent.name}</span>
                </div>
              </>
            )}
            {order.notes && (
              <>
                <Separator className="my-2" />
                <p className="text-muted-foreground">Notes</p>
                <p>{order.notes}</p>
              </>
            )}
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
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell className="text-right text-muted-foreground">Subtotal</TableCell>
                <TableCell className="text-right">{formatCurrency(order.subtotal)}</TableCell>
              </TableRow>
              {order.discount > 0 && (
                <TableRow>
                  <TableCell colSpan={4} />
                  <TableCell className="text-right text-muted-foreground">Discount</TableCell>
                  <TableCell className="text-right text-destructive">-{formatCurrency(order.discount)}</TableCell>
                </TableRow>
              )}
              {order.shipping > 0 && (
                <TableRow>
                  <TableCell colSpan={4} />
                  <TableCell className="text-right text-muted-foreground">Shipping</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.shipping)}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={4} />
                <TableCell className="text-right font-bold">Total</TableCell>
                <TableCell className="text-right font-bold text-lg">{formatCurrency(order.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statuses.filter(s => s !== 'cancelled' && s !== 'returned').map((status, i) => {
              const statusIndex = statuses.indexOf(order.status)
              const currentIndex = statuses.indexOf(status)
              const isReached = currentIndex <= statusIndex && !['cancelled', 'returned'].includes(order.status)
              const isCancelledOrReturned = ['cancelled', 'returned'].includes(order.status)

              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${isCancelledOrReturned ? 'bg-red-400' : isReached ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <span className={`text-sm ${isReached ? 'font-medium' : 'text-muted-foreground'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
              )
            })}
            {['cancelled', 'returned'].includes(order.status) && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <span className="text-sm font-medium text-red-600">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
