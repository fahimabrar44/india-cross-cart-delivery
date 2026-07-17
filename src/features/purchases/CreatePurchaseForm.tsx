'use client'

import { useState, useEffect } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { useBrandStore } from '@/store/useBrandStore'
import { formatCurrency } from '@/lib/utils'

interface Brand { _id: string; name: string; currencySymbol: string }
interface Supplier { _id: string; name: string; company?: string }
interface Product { _id: string; name: string; sku: string; purchasePrice: number }

interface PurchaseItem {
  product: string
  name: string
  sku: string
  quantity: number
  cost: number
  total: number
}

export function CreatePurchaseForm() {
  const router = useRouter()
  const { selectedBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [brand, setBrand] = useState(selectedBrand || '')
  const [loading, setLoading] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplier, setSupplier] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')

  const [items, setItems] = useState<PurchaseItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(json => {
        setBrands(json.data || [])
        if (!brand && json.data?.length) setBrand(json.data[0]._id)
      })
  }, [])

  useEffect(() => {
    if (brand) {
      fetch(`/api/suppliers?brand=${brand}&limit=200`)
        .then(r => r.json())
        .then(json => setSuppliers(json.data || []))
      fetch(`/api/products?brand=${brand}&limit=200`)
        .then(r => r.json())
        .then(json => setProducts(json.data || []))
    }
  }, [brand])

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const grandTotal = Math.max(0, subtotal - discount)

  function addProduct() {
    if (!selectedProduct) { toast.error('Please select a product'); return }
    const product = products.find(p => p._id === selectedProduct)
    if (!product) return

    const existing = items.find(i => i.product === product._id)
    if (existing) {
      setItems(items.map(i =>
        i.product === product._id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.cost }
          : i
      ))
    } else {
      setItems([...items, {
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        cost: product.purchasePrice,
        total: product.purchasePrice,
      }])
    }
    setSelectedProduct('')
  }

  function updateItem(index: number, field: 'quantity' | 'cost', value: number) {
    setItems(items.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      updated.total = updated.quantity * updated.cost
      return updated
    }))
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand) { toast.error('Please select a brand'); return }
    if (!supplier) { toast.error('Please select a supplier'); return }
    if (items.length === 0) { toast.error('Please add at least one item'); return }

    setLoading(true)
    try {
      const body = {
        brand,
        supplier,
        items,
        subtotal,
        discount,
        paymentStatus,
        notes,
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Purchase created')
      router.push('/purchases')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create purchase')
    } finally {
      setLoading(false)
    }
  }

  const currentBrand = brands.find(b => b._id === brand)
  const symbol = currentBrand?.currencySymbol || '৳'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Purchase</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Purchase Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select value={brand} onValueChange={(v) => { setBrand(v || ''); setSupplier('') }}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplier} onValueChange={(v) => setSupplier(v || '')}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}{s.company ? ` (${s.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v || 'pending')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Products</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v || '')}>
                  <SelectTrigger><SelectValue placeholder="Select product to add..." /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} ({p.sku}) - {formatCurrency(p.purchasePrice, symbol)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={addProduct}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center w-24">Qty</TableHead>
                      <TableHead className="text-right w-28">Cost/Unit</TableHead>
                      <TableHead className="text-right w-28">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateItem(i, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                            className="h-8 text-center w-20 mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cost}
                            onChange={e => updateItem(i, 'cost', Math.max(0, Number(e.target.value) || 0))}
                            className="h-8 text-right w-24 ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total, symbol)}</TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal, symbol)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Discount</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="h-8 w-32 text-right"
              />
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-semibold">Grand Total</span>
              <span className="text-lg font-bold">{formatCurrency(grandTotal, symbol)}</span>
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
            Create Purchase
          </Button>
        </div>
      </form>
    </div>
  )
}
