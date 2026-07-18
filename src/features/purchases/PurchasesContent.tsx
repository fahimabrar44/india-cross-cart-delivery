'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { ChevronDown, ChevronRight, ShoppingCart, RefreshCw, Plus } from 'lucide-react'

interface Purchase {
  _id: string
  invoiceNumber: string
  brand: { _id: string; name: string; currencySymbol: string }
  supplier: { _id: string; name: string; company?: string }
  items: { product: { _id: string; name: string }; quantity: number; cost: number }[]
  subtotal: number
  discount: number
  total: number
  paymentStatus: string
  purchaseDate: string
  createdAt: string
}

export function PurchasesContent() {
  const { selectedBrand } = useBrandStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBrand) params.set('brand', selectedBrand)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/purchases?${params}`)
      const json = await res.json()
      setPurchases(json.data || [])
      setTotalPages(json.totalPages || 1)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, page])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <a href="/purchases/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase
            </Button>
          </a>
          <Button variant="outline" size="icon" onClick={fetchPurchases}>
            <RefreshCw className="h-4 w-4" />
          </Button>
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
                  <TableHead>Invoice#</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No purchases found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <React.Fragment key={purchase._id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === purchase._id ? null : purchase._id)}>
                        <TableCell className="font-medium font-mono text-sm">
                          <div className="flex items-center gap-2">
                            {expandedId === purchase._id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            {purchase.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{purchase.supplier?.name || 'N/A'}</p>
                          {purchase.supplier?.company && (
                            <p className="text-xs text-muted-foreground">{purchase.supplier.company}</p>
                          )}
                        </TableCell>
                        <TableCell>{purchase.brand?.name || '-'}</TableCell>
                        <TableCell className="text-center">{purchase.items?.length || 0}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(purchase.total, purchase.brand?.currencySymbol)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(purchase.paymentStatus)}>
                            {purchase.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(purchase.purchaseDate || purchase.createdAt)}
                        </TableCell>
                      </TableRow>
                      {expandedId === purchase._id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="space-y-4 text-sm">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-muted-foreground mb-1">Supplier</p>
                                  <p className="font-medium">{purchase.supplier?.name || 'N/A'}</p>
                                  {purchase.supplier?.company && <p className="text-muted-foreground">{purchase.supplier.company}</p>}
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Payment Status</p>
                                  <Badge className={getStatusColor(purchase.paymentStatus)}>{purchase.paymentStatus}</Badge>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Subtotal</p>
                                  <p>{formatCurrency(purchase.subtotal, purchase.brand?.currencySymbol)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Discount</p>
                                  <p>{formatCurrency(purchase.discount, purchase.brand?.currencySymbol)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Total</p>
                                  <p className="font-medium">{formatCurrency(purchase.total, purchase.brand?.currencySymbol)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Date</p>
                                  <p>{formatDate(purchase.purchaseDate || purchase.createdAt)}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-2 font-medium">Items</p>
                                <div className="space-y-1">
                                  {purchase.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-background rounded px-3 py-1.5">
                                      <span>{item.product?.name || 'Unknown'}</span>
                                      <span className="text-muted-foreground">x{item.quantity} @ {formatCurrency(item.cost, purchase.brand?.currencySymbol)}</span>
                                    </div>
                                  ))}
                                  {(!purchase.items || purchase.items.length === 0) && (
                                    <p className="text-muted-foreground">No items</p>
                                  )}
                                </div>
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
    </div>
  )
}
