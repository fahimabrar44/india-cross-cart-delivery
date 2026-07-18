'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { useBrandStore } from '@/store/useBrandStore'
import { formatCurrency } from '@/lib/utils'

interface Customer { _id: string; name: string; phone: string; address?: string; district?: string }
interface Brand { _id: string; name: string }
interface Product { _id: string; name: string; sku: string; sellingPrice: number }

interface LineItem {
  product: string
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

const emptyAddress = { name: '', phone: '', address: '', district: '', country: 'Bangladesh' }

export function CreateOrderForm() {
  const router = useRouter()
  const { selectedBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [brand, setBrand] = useState(selectedBrand || '')
  const [loading, setLoading] = useState(false)

  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOpen, setCustomerOpen] = useState(false)

  const [productQuery, setProductQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [productOpen, setProductOpen] = useState(false)

  const [items, setItems] = useState<LineItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [notes, setNotes] = useState('')
  const [shippingAddress, setShippingAddress] = useState(emptyAddress)

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(json => {
        setBrands(json.data || [])
        if (!brand && json.data?.length) setBrand(json.data[0]._id)
      })
  }, [])

  useEffect(() => {
    if (!customerQuery.trim()) { setCustomers([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(customerQuery)}&limit=10`)
      const json = await res.json()
      setCustomers(json.data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [customerQuery])

  useEffect(() => {
    if (!productQuery.trim() || !brand) { setProducts([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/products?brand=${brand}&search=${encodeURIComponent(productQuery)}&limit=10`)
      const json = await res.json()
      setProducts(json.data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [productQuery, brand])

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const total = Math.max(0, subtotal - discount + shipping)

  function addItem(product: Product) {
    const existing = items.find(i => i.product === product._id)
    if (existing) {
      setItems(items.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i))
    } else {
      setItems([...items, { product: product._id, name: product.name, sku: product.sku, quantity: 1, price: product.sellingPrice, total: product.sellingPrice }])
    }
    setProductQuery('')
    setProductOpen(false)
  }

  function updateItem(index: number, field: 'quantity' | 'price', value: number) {
    setItems(items.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      updated.total = updated.quantity * updated.price
      return updated
    }))
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand) { toast.error('Please select a brand'); return }

    if (items.length === 0) { toast.error('Please add at least one item'); return }
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.district) {
      toast.error('Please fill in shipping address'); return
    }

    setLoading(true)
    try {
      const body = {
        brand,
        customer: selectedCustomer._id,
        items,
        subtotal,
        discount,
        shipping,
        total,
        notes,
        shippingAddress,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Order created')
      router.push('/orders')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Order</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select value={brand} onValueChange={(v) => setBrand(v || '')}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setCustomerQuery('') }}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customerQuery}
                    onChange={e => { setCustomerQuery(e.target.value); setCustomerOpen(true) }}
                    onFocus={() => setCustomerOpen(true)}
                    placeholder="Search customers by name or phone..."
                    className="pl-10"
                  />
                  {customerOpen && customers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full border rounded-lg bg-background shadow-lg max-h-60 overflow-auto">
                      {customers.map(c => (
                        <button
                          type="button"
                          key={c._id}
                          className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
                          onClick={() => { setSelectedCustomer(c); setCustomerOpen(false); setCustomerQuery(`${c.name} - ${c.phone}`) }}
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground ml-2">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Products</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={productQuery}
                onChange={e => { setProductQuery(e.target.value); setProductOpen(true) }}
                onFocus={() => setProductOpen(true)}
                placeholder="Search products to add..."
                className="pl-10"
              />
              {productOpen && products.length > 0 && (
                <div className="absolute z-10 mt-1 w-full border rounded-lg bg-background shadow-lg max-h-60 overflow-auto">
                  {products.map(p => (
                    <button
                      type="button"
                      key={p._id}
                      className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center justify-between"
                      onClick={() => addItem(p)}
                    >
                      <span>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2">{p.sku}</span>
                      </span>
                      <span className="font-medium">{formatCurrency(p.sellingPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3">Product</th>
                      <th className="text-center p-3 w-24">Qty</th>
                      <th className="text-right p-3 w-28">Price</th>
                      <th className="text-right p-3 w-28">Total</th>
                      <th className="w-10 p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                            className="h-8 text-center w-20 mx-auto"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={e => updateItem(i, 'price', Math.max(0, Number(e.target.value) || 0))}
                            className="h-8 text-right w-24 ml-auto"
                          />
                        </td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.total)}</td>
                        <td className="p-3">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={shippingAddress.name} onChange={e => setShippingAddress({ ...shippingAddress, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={shippingAddress.phone} onChange={e => setShippingAddress({ ...shippingAddress, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Textarea value={shippingAddress.address} onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>District *</Label>
                <Input value={shippingAddress.district} onChange={e => setShippingAddress({ ...shippingAddress, district: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={shippingAddress.country} onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Pricing & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <div className="h-10 flex items-center font-medium">{formatCurrency(subtotal)}</div>
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div className="space-y-2">
                <Label>Shipping</Label>
                <Input type="number" min="0" step="0.01" value={shipping} onChange={e => setShipping(Math.max(0, Number(e.target.value) || 0))} />
              </div>
            </div>
            <div className="flex justify-end">
              <div className="text-lg font-bold">Total: {formatCurrency(total)}</div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Order
          </Button>
        </div>
      </form>
    </div>
  )
}
