'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { Boxes, RefreshCw, PackagePlus, SlidersHorizontal, History, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'

interface InventoryItem {
  _id: string
  product: { _id: string; name: string; sku: string }
  warehouse: { _id: string; name: string }
  brand: { _id: string; name: string }
  openingStock: number
  currentStock: number
}

interface WarehouseItem {
  _id: string
  name: string
}

interface ProductItem {
  _id: string
  name: string
  sku: string
}

interface Transaction {
  _id: string
  product: { _id: string; name: string; sku: string }
  warehouse: { _id: string; name: string }
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reference?: string
  note?: string
  performedBy?: { _id: string; name: string }
  createdAt: string
}

export function InventoryContent() {
  const { selectedBrand } = useBrandStore()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const [brands, setBrands] = useState<{ _id: string; name: string }[]>([])
  const [stockInOpen, setStockInOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [stockInForm, setStockInForm] = useState({
    product: '',
    warehouse: '',
    brand: selectedBrand || '',
    quantity: '',
    note: '',
  })

  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    note: '',
  })

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams()
    if (selectedBrand) params.set('brand', selectedBrand)
    if (selectedWarehouse && selectedWarehouse !== 'all') params.set('warehouse', selectedWarehouse)

    fetch(`/api/inventory?${params}`)
      .then((res) => res.json())
      .then((json) => { if (mounted) { setInventory(json.data || []); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [selectedBrand, selectedWarehouse, refreshKey])

  useEffect(() => {
    let mounted = true
    const params = new URLSearchParams()
    if (selectedBrand) params.set('brand', selectedBrand)

    Promise.all([
      fetch(`/api/warehouses?${params}`).then(r => r.json()),
      fetch(`/api/products?${params}&limit=500`).then(r => r.json()),
      fetch(`/api/brands`).then(r => r.json()),
    ]).then(([wJson, pJson, bJson]) => {
      if (mounted) {
        setWarehouses(wJson.data || [])
        setProducts(pJson.data || [])
        setBrands(bJson.data || [])
        if (!stockInForm.brand && bJson.data?.length) {
          setStockInForm(f => ({ ...f, brand: bJson.data[0]._id }))
        }
      }
    }).catch(() => {})

    return () => { mounted = false }
  }, [selectedBrand])

  useEffect(() => {
    if (!stockInForm.brand) return
    let mounted = true
    const params = new URLSearchParams()
    params.set('brand', stockInForm.brand)

    Promise.all([
      fetch(`/api/warehouses?${params}`).then(r => r.json()),
      fetch(`/api/products?${params}&limit=500`).then(r => r.json()),
    ]).then(([wJson, pJson]) => {
      if (mounted) {
        setWarehouses(wJson.data || [])
        setProducts(pJson.data || [])
      }
    }).catch(() => {})

    return () => { mounted = false }
  }, [stockInForm.brand])

  async function handleStockIn(e: React.FormEvent) {
    e.preventDefault()
    if (!stockInForm.product || !stockInForm.warehouse || !stockInForm.quantity) {
      toast.error('Product, Warehouse and Quantity are required')
      return
    }
    if (!stockInForm.brand) {
      toast.error('Please select a brand')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'stock_in',
          product: stockInForm.product,
          warehouse: stockInForm.warehouse,
          brand: stockInForm.brand,
          quantity: Number(stockInForm.quantity),
          note: stockInForm.note,
        }),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Stock added successfully')
      setStockInOpen(false)
      setStockInForm({ product: '', warehouse: '', brand: selectedBrand || '', quantity: '', note: '' })
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setSaving(false)
    }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustForm.quantity || !selectedItem) {
      toast.error('Quantity is required')
      return
    }

    const qty = Number(adjustForm.quantity)

    setSaving(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: qty >= 0 ? 'stock_in' : 'stock_out',
          product: selectedItem.product._id,
          warehouse: selectedItem.warehouse._id,
          brand: selectedItem.brand._id,
          quantity: Math.abs(qty),
          note: adjustForm.note || 'Manual adjustment',
        }),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success('Stock adjusted')
      setAdjustOpen(false)
      setAdjustForm({ quantity: '', note: '' })
      setSelectedItem(null)
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setSaving(false)
    }
  }

  function openAdjust(item: InventoryItem) {
    setSelectedItem(item)
    setAdjustForm({ quantity: '', note: '' })
    setAdjustOpen(true)
  }

  async function openHistory(item: InventoryItem) {
    setHistoryItem(item)
    setHistoryOpen(true)
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('product', item.product._id)
      params.set('warehouse', item.warehouse._id)
      if (item.brand?._id) params.set('brand', item.brand._id)
      const res = await fetch(`/api/inventory/transactions?${params}`)
      const json = await res.json()
      setTransactions(json.data || [])
    } catch {
      setTransactions([])
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <Dialog open={stockInOpen} onOpenChange={setStockInOpen}>
            <DialogTrigger>
              <Button>
                <PackagePlus className="mr-2 h-4 w-4" />
                Stock In
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <form onSubmit={handleStockIn}>
                <DialogHeader>
                  <DialogTitle>Stock In</DialogTitle>
                  <DialogDescription>Add stock to inventory</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Brand *</Label>
                    <Select value={stockInForm.brand} onValueChange={(v) => setStockInForm({ ...stockInForm, brand: v || '' })}>
                      <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent>
                        {brands.map(b => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select value={stockInForm.product} onValueChange={(v) => setStockInForm({ ...stockInForm, product: v || '' })}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p._id} value={p._id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={stockInForm.warehouse} onValueChange={(v) => setStockInForm({ ...stockInForm, warehouse: v || '' })}>
                      <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map(w => (
                          <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={stockInForm.quantity}
                      onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Input
                      value={stockInForm.note}
                      onChange={(e) => setStockInForm({ ...stockInForm, note: e.target.value })}
                      placeholder="Optional note"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStockInOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Stock'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-[200px]">
          <Select value={selectedWarehouse} onValueChange={(val) => setSelectedWarehouse(val)}>
            <SelectTrigger>
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                  <TableHead>Product SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Opening Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Boxes className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No inventory records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-mono text-sm">{item.product?.sku || '-'}</TableCell>
                      <TableCell className="font-medium">{item.product?.name || '-'}</TableCell>
                      <TableCell>{item.brand?.name || '-'}</TableCell>
                      <TableCell>{item.warehouse?.name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{item.currentStock}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.openingStock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openHistory(item)}>
                            <History className="h-4 w-4 mr-1" />
                            History
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openAdjust(item)}>
                            <SlidersHorizontal className="h-4 w-4 mr-1" />
                            Adjust
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onOpenChange={(o) => { if (!o) { setAdjustOpen(false); setSelectedItem(null) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleAdjust}>
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
              <DialogDescription>
                {selectedItem ? `${selectedItem.product?.name} — Current: ${selectedItem.currentStock}` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  placeholder="Use positive to add, negative to remove"
                />
                <p className="text-xs text-muted-foreground">Positive = add stock, Negative = remove stock</p>
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Input
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setAdjustOpen(false); setSelectedItem(null) }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Adjusting...' : 'Adjust Stock'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={(o) => { if (!o) { setHistoryOpen(false); setHistoryItem(null) } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock History</DialogTitle>
            <DialogDescription>
              {historyItem ? `${historyItem.product?.name} — ${historyItem.warehouse?.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No transactions found</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t._id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        t.type === 'stock_in' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        t.type === 'stock_out' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {t.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-muted-foreground">{formatDateTime(t.createdAt)}</span>
                    </div>
                    <p className="text-muted-foreground">
                      Qty: <span className={t.quantity > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{t.quantity > 0 ? '+' : ''}{t.quantity}</span>
                      {' | '}Before: {t.previousStock} → After: {t.newStock}
                    </p>
                    {t.reference && <p className="text-xs text-muted-foreground">Ref: {t.reference}</p>}
                    {t.note && <p className="text-xs text-muted-foreground">Note: {t.note}</p>}
                    {t.performedBy && <p className="text-xs text-muted-foreground">By: {t.performedBy.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
