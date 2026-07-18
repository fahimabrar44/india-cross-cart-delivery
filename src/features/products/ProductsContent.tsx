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
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Search, Package, RefreshCw } from 'lucide-react'

interface Product {
  _id: string
  name: string
  sku: string
  sellingPrice: number
  purchasePrice: number
  isActive: boolean
  stockAlertLimit: number
  category?: { _id: string; name: string }
  description?: string
  barcode?: string
  brand?: { _id: string; name: string }
  createdAt?: string
}

export function ProductsContent() {
  const router = useRouter()
  const { selectedBrand } = useBrandStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBrand) params.set('brand', selectedBrand)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/products?${params}`)
      const json = await res.json()
      setProducts(json.data || [])
      setTotalPages(json.totalPages || 1)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, search, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <Button onClick={() => router.push('/products/new')}>Add Product</Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchProducts}>
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
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No products found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <React.Fragment key={product._id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === product._id ? null : product._id)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {expandedId === product._id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{product.sku}</TableCell>
                        <TableCell>{product.category?.name || '-'}</TableCell>
                        <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.isActive ? 'active' : 'inactive')}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{product.stockAlertLimit}</TableCell>
                      </TableRow>
                      {expandedId === product._id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Description</p>
                                <p>{product.description || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Barcode</p>
                                <p>{product.barcode || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Category</p>
                                <p>{product.category?.name || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Brand</p>
                                <p>{product.brand?.name || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Created</p>
                                <p>{product.createdAt ? formatDate(product.createdAt) : '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Stock Alert Limit</p>
                                <p>{product.stockAlertLimit}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Purchase Price</p>
                                <p>{formatCurrency(product.purchasePrice)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Selling Price</p>
                                <p className="font-medium">{formatCurrency(product.sellingPrice)}</p>
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
