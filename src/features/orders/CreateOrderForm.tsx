'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Search, Trash2, Check, X } from 'lucide-react'
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

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

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
    if (!brand) return
    setProductsLoading(true)
    fetch(`/api/products?brand=${brand}&limit=500`)
      .then(r => r.json())
      .then(json => setAllProducts(json.data || []))
      .catch(() => {})
      .finally(() => setProductsLoading(false))
  }, [brand])

  const filteredProducts = allProducts.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const total = Math.max(0, subtotal - discount + shipping)

  function toggleProductSelect(id: string) {
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function addSelectedProducts() {
    if (selectedProductIds.size === 0) { toast.error('Select products first'); return }
    const added: string[] = []
    selectedProductIds.forEach(id => {
      const product = allProducts.find(p => p._id === id)
      if (!product) return
      const existing = items.find(i => i.product === product._id)
      if (existing) {
        setItems(prev => prev.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i))
      } else {
        setItems(prev => [...prev, { product: product._id, name: product.name, sku: product.sku, quantity: 1, price: product.sellingPrice, total: product.sellingPrice }])
      }
      added.push(product.name)
    })
    setSelectedProductIds(new Set())
    toast.success(`${added.length} product(s) added`)
  }

  function addSingleProduct(product: Product) {
    const existing = items.find(i => i.product === product._id)
    if (existing) {
      setItems(items.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i))
    } else {
      setItems([...items, { product: product._id, name: product.name, sku: product.sku, quantity: 1, price: product.sellingPrice, total: product.sellingPrice }])
    }
    setSelectedProductIds(prev => { const n = new Set(prev); n.delete(product._id); return n })
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
      const body: Record<string, unknown> = {
        brand,
        items,
        subtotal,
        discount,
        shipping,
        total,
        notes,
        shippingAddress,
      }
      if (selectedCustomer) body.customer = selectedCustomer._id

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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Order</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
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

            <Card>
              <CardHeader><CardTitle>Products</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Filter products..."
                    className="pl-10"
                  />
                </div>

                {productsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">No products found</p>
                ) : (
                  <>
                    <div className="border rounded-lg max-h-64 overflow-y-auto divide-y">
                      {filteredProducts.map(p => (
                        <label
                          key={p._id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                        >
                          <Checkbox
                            checked={selectedProductIds.has(p._id)}
                            onCheckedChange={() => toggleProductSelect(p._id)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{p.name}</span>
                            <span className="text-muted-foreground text-xs">{p.sku}</span>
                          </div>
                          <span className="font-medium shrink-0">{formatCurrency(p.sellingPrice)}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); addSingleProduct(p) }}
                            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/10 text-primary"
                            title="Add this product"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </label>
                      ))}
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={addSelectedProducts} disabled={selectedProductIds.size === 0}>
                      <Check className="mr-2 h-4 w-4" />
                      Add Selected ({selectedProductIds.size})
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {items.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-3">Product</th>
                          <th className="text-center p-3 w-20">Qty</th>
                          <th className="text-right p-3 w-24">Price</th>
                          <th className="text-right p-3 w-24">Total</th>
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
                                className="h-8 text-center w-16 mx-auto"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={e => updateItem(i, 'price', Math.max(0, Number(e.target.value) || 0))}
                                className="h-8 text-right w-20 ml-auto"
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
                </CardContent>
              </Card>
            )}

            <Card>
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

            <Card>
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
