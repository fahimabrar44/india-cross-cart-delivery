'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { ChevronDown, ChevronRight, Search, ShoppingBag, RefreshCw, Eye, Pencil, Trash2, Phone, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Order {
  _id: string
  orderNumber: string
  customer: { _id: string; name: string; phone: string }
  total: number
  codAmount: number
  paymentStatus: string
  status: string
  courierName?: string
  trackingNumber?: string
  createdAt: string
  agent?: { _id: string; name: string }
}

const callStatuses = [
  { value: 'confirmed', label: 'Order Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Order Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'no_response', label: 'No Response', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hold', label: 'Order Hold', color: 'bg-orange-100 text-orange-800' },
] as const

export function OrdersContent() {
  const { selectedBrand } = useBrandStore()
  const [mounted, setMounted] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [callOrderId, setCallOrderId] = useState<string | null>(null)
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [calling, setCalling] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/orders/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDeleteOpen(false)
      setDeleteId(null)
      fetchOrders()
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  async function handleCall(callStatus: string) {
    if (!callOrderId) return
    setCalling(true)
    const order = orders.find(o => o._id === callOrderId)
    if (!order) return

    try {
      const label = callStatuses.find(s => s.value === callStatus)?.label || callStatus

      const res = await fetch(`/api/orders/${callOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNote: `Call: ${label}`,
          status: ['confirmed', 'cancelled'].includes(callStatus) ? callStatus : order.status,
        }),
      })
      if (!res.ok) throw new Error('Failed to update order')

      await fetch(`/api/orders/${callOrderId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: order.customer?.phone || 'N/A', response: label }),
      }).catch(() => {})

      if (order.customer?._id) {
        await fetch(`/api/customers/${order.customer._id}/call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: order.customer.phone,
            response: label,
            orderId: callOrderId,
          }),
        }).catch(() => {})
      }

      toast.success(`Call logged: ${label}`)
      setCallDialogOpen(false)
      setCallOrderId(null)
      fetchOrders()
    } catch {
      toast.error('Failed to log call')
    } finally {
      setCalling(false)
    }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBrand) params.set('brand', selectedBrand)
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/orders?${params}`)
      const json = await res.json()
      setOrders(json.data || [])
      setTotalPages(json.totalPages || 1)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, statusFilter, search, page])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <a href="/orders/new">
            <Button>New Order</Button>
          </a>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer, phone, tracking..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || ''); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <React.Fragment key={order._id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {expandedId === order._id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            {order.orderNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{order.customer?.name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer?.phone}</p>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.courierName || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={(e) => { e.stopPropagation(); setCallOrderId(order._id); setCallDialogOpen(true) }}
                              title="Log Call"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <a href={`/orders/${order._id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <a href={`/orders/${order._id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(order._id); setDeleteOpen(true) }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === order._id && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Customer</p>
                                <p className="font-medium">{order.customer?.name}</p>
                                <p className="text-muted-foreground">{order.customer?.phone}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Shipping</p>
                                <p>{order.courierName || 'N/A'}</p>
                                <p className="text-muted-foreground">{order.trackingNumber || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Payment</p>
                                <p className="font-medium">{formatCurrency(order.total)}</p>
                                <p className="text-muted-foreground">COD: {formatCurrency(order.codAmount)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Item Count</p>
                                <p>-</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Agent</p>
                                <p>{order.agent?.name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Date</p>
                                <p>{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteId(null) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setDeleteOpen(false); setDeleteId(null) }}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mounted && (
        <Dialog open={callDialogOpen} onOpenChange={(o) => { if (!o) { setCallDialogOpen(false); setCallOrderId(null) } }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Log Call Response</DialogTitle>
              <DialogDescription>
                {callOrderId && (() => {
                  const o = orders.find(ord => ord._id === callOrderId)
                  return o ? `Calling ${o.customer?.name || 'Unknown'} at ${o.customer?.phone || 'N/A'}` : ''
                })()}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              {callStatuses.map(s => (
                <Button
                  key={s.value}
                  type="button"
                  variant="outline"
                  className={`h-auto py-4 flex flex-col items-center gap-1 ${s.color}`}
                  onClick={() => handleCall(s.value)}
                  disabled={calling}
                >
                  {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                  <span className="text-xs font-medium">{s.label}</span>
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCallDialogOpen(false); setCallOrderId(null) }} disabled={calling}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
