'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ArrowLeft, Edit, Trash2, Phone, PhoneCall, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface CallLog {
  _id: string
  phone: string
  response: string
  orderId?: { _id: string; orderNumber: string }
  timestamp: string
  userId?: { _id: string; name: string }
}

interface Customer {
  _id: string
  name: string
  phone: string
  whatsapp?: string
  email?: string
  address?: string
  district?: string
  country?: string
  brand: { _id: string; name: string }
  totalOrders: number
  totalPurchases: number
  isBlacklisted: boolean
  notes?: string
  callLogs: CallLog[]
  createdAt: string
  updatedAt: string
}

interface Order {
  _id: string
  orderNumber: string
  total: number
  codAmount: number
  paymentStatus: string
  status: string
  courierName?: string
  createdAt: string
}

export function CustomerDetail({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [callResponse, setCallResponse] = useState('')
  const [calling, setCalling] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const fetchData = useCallback(async () => {
    try {
      const [customerRes, ordersRes] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch(`/api/orders?customer=${customerId}&limit=50`),
      ])
      const customerJson = await customerRes.json()
      const ordersJson = await ordersRes.json()
      if (customerJson.data) setCustomer(customerJson.data)
      setOrders(ordersJson.data || [])
    } catch {
      toast.error('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Customer deleted')
      router.push('/customers')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  async function logCall() {
    if (!callResponse.trim()) { toast.error('Please enter call response'); return }
    setCalling(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customer?.phone, response: callResponse }),
      })
      if (!res.ok) throw new Error('Failed to log call')
      toast.success('Call logged')
      setCallDialogOpen(false)
      setCallResponse('')
      fetchData()
    } catch {
      toast.error('Failed to log call')
    } finally {
      setCalling(false)
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

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/customers')}>Back to Customers</Button>
      </div>
    )
  }

  const totalPurchaseAmount = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">Customer since {formatDate(customer.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCallDialogOpen(true)}>
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" onClick={() => router.push(`/customers/${customerId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            {customer.isBlacklisted ? (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Blacklisted</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(customer.totalPurchases)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">Phone</span>
                <p className="font-medium">{customer.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">WhatsApp</span>
                <p className="font-medium">{customer.whatsapp || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{customer.email || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Brand</span>
                <p className="font-medium">{customer.brand?.name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Address</span>
              <p className="font-medium">{customer.address || 'No address on file'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground">District</span>
                <p className="font-medium">{customer.district || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Country</span>
                <p className="font-medium">{customer.country || '-'}</p>
              </div>
            </div>
            {customer.notes && (
              <>
                <Separator className="my-2" />
                <div>
                  <span className="text-muted-foreground">Notes</span>
                  <p className="font-medium">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Call Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.callLogs && customer.callLogs.length > 0 ? (
                customer.callLogs.map((log, i) => (
                  <TableRow key={log._id || i}>
                    <TableCell className="text-sm">{format(new Date(log.timestamp), 'MMM d, h:mm a')}</TableCell>
                    <TableCell>{log.phone}</TableCell>
                    <TableCell>{log.response}</TableCell>
                    <TableCell>
                      {log.orderId
                        ? typeof log.orderId === 'object'
                          ? (log.orderId as { orderNumber: string }).orderNumber
                          : 'Yes'
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No call logs
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Order History ({orders.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No orders found for this customer
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => window.location.href = `/orders/${order._id}`}
                  >
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-right text-sm text-muted-foreground">
        Total purchase amount across all orders: <span className="font-bold text-foreground">{formatCurrency(totalPurchaseAmount)}</span>
      </div>

      {mounted && <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Call {customer.name}</DialogTitle>
            <DialogDescription>
              Calling {customer.phone}. Enter the response after the call.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Call Response</Label>
              <Input
                value={callResponse}
                onChange={e => setCallResponse(e.target.value)}
                placeholder="e.g., Not interested, Will order later, Complaint..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallDialogOpen(false)} disabled={calling}>Cancel</Button>
            <Button onClick={logCall} disabled={calling}>
              {calling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PhoneCall className="h-4 w-4 mr-2" />}
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div>
  )
}
