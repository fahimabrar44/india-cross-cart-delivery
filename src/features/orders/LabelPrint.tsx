'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Printer, Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import QRCode from 'qrcode'

interface OrderForLabel {
  _id: string
  orderNumber: string
  brand: { name: string }
  courierName?: string
  trackingNumber?: string
  shippingAddress: { name: string; phone: string; address: string; district: string }
  items: Array<{ name: string; quantity: number }>
}

export function LabelPrint() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderForLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [orderIdsInput, setOrderIdsInput] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  async function fetchOrders(ids: string[]) {
    setLoading(true)
    try {
      const fetched: OrderForLabel[] = []
      for (const id of ids) {
        const res = await fetch(`/api/orders/${id.trim()}`)
        if (res.ok) {
          const json = await res.json()
          fetched.push(json.data)
        }
      }
      setOrders(fetched)
      if (fetched.length === 0) toast.error('No valid orders found')
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  function handleLoad() {
    const ids = orderIdsInput.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
    if (ids.length === 0) { toast.error('Enter at least one order ID'); return }
    fetchOrders(ids)
  }

  function handlePrint() {
    window.print()
  }

  const pages: OrderForLabel[][] = []
  for (let i = 0; i < orders.length; i += 4) {
    pages.push(orders.slice(i, i + 4))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Label Print</h1>
        </div>
        <Button onClick={handlePrint} disabled={orders.length === 0}>
          <Printer className="h-4 w-4 mr-2" /> Print Labels ({orders.length})
        </Button>
      </div>

      <div className="flex items-end gap-2 no-print">
        <div className="flex-1">
          <Label>Order IDs (space or comma separated)</Label>
          <Input
            value={orderIdsInput}
            onChange={e => setOrderIdsInput(e.target.value)}
            placeholder="e.g., orderId1 orderId2 orderId3 orderId4"
            onKeyDown={e => { if (e.key === 'Enter') handleLoad() }}
          />
        </div>
        <Button onClick={handleLoad} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Load
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div ref={printRef} className="space-y-8">
          {pages.map((pageOrders, pageIdx) => (
            <div
              key={pageIdx}
              className="label-page"
            >
              {Array.from({ length: 4 }).map((_, slotIdx) => {
                const order = pageOrders[slotIdx]
                if (!order) return <div key={slotIdx} className="label-slot border border-dashed border-gray-300 rounded bg-gray-50/50" />
                return <LabelCard key={order._id} order={order} />
              })}
            </div>
          ))}
          {orders.length === 0 && !loading && (
            <div className="text-center py-20 text-muted-foreground">
              Enter order IDs above to load labels
            </div>
          )}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
          @page { margin: 3mm; size: A4; }
        }
        .label-page {
          width: 210mm;
          min-height: 290mm;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 3mm;
          padding: 3mm;
          background: white;
          page-break-after: always;
        }
        .label-slot {
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  )
}

function LabelCard({ order }: { order: OrderForLabel }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, order._id, {
        width: 80,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
    }
  }, [order._id])

  return (
    <div className="label-slot border border-black rounded p-2 text-[8px] font-sans leading-tight">
      <div className="text-center font-bold text-[9px] border-b border-black pb-1 mb-1 uppercase tracking-wider">
        {order.brand?.name || 'BRAND'}
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center w-[90px] shrink-0">
          <canvas ref={canvasRef} width={80} height={80} className="border border-gray-300" />
          <span className="text-[5px] mt-1 text-center break-all max-w-[80px]">{order.orderNumber}</span>
        </div>

        <div className="flex-1 space-y-0.5 overflow-hidden text-[7.5px]">
          <p className="font-bold text-[9px] truncate">{order.shippingAddress.name}</p>
          <p><span className="font-medium">Phone:</span> {order.shippingAddress.phone}</p>
          <p className="truncate"><span className="font-medium">Addr:</span> {order.shippingAddress.address}, {order.shippingAddress.district}</p>
          <p><span className="font-medium">Courier:</span> {order.courierName || 'N/A'}</p>
          <p><span className="font-medium">Tracking:</span> {order.trackingNumber || 'N/A'}</p>
          <div className="pt-0.5 border-t border-dashed border-gray-300">
            <p className="font-medium">Items:</p>
            <ul className="list-none">
              {order.items.slice(0, 3).map((item, i) => (
                <li key={i} className="truncate">{item.name} x{item.quantity}</li>
              ))}
              {order.items.length > 3 && <li className="text-[6px]">+{order.items.length - 3} more</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center text-[5px] border-t border-black pt-0.5 mt-0.5 text-gray-500">
        {order.orderNumber} | {order.shippingAddress.district}
      </div>
    </div>
  )
}
