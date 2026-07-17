'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { Boxes, RefreshCw, PackagePlus, SlidersHorizontal } from 'lucide-react'

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

export function InventoryContent() {
  const { selectedBrand } = useBrandStore()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>('all')
  const [refreshKey, setRefreshKey] = useState(0)

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

    fetch(`/api/warehouses?${params}`)
      .then((res) => res.json())
      .then((json) => { if (mounted) setWarehouses(json.data || []) })
      .catch(() => {})

    return () => { mounted = false }
  }, [selectedBrand])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <Button>
            <PackagePlus className="mr-2 h-4 w-4" />
            Stock In
          </Button>
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
                          <Button variant="ghost" size="sm">
                            <PackagePlus className="h-4 w-4 mr-1" />
                            Stock In
                          </Button>
                          <Button variant="ghost" size="sm">
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
    </div>
  )
}
