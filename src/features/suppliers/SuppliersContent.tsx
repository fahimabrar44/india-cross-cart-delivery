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
import { formatDate } from '@/lib/utils'
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { ChevronDown, ChevronRight, Search, Truck, RefreshCw, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Supplier {
  _id: string
  name: string
  company?: string
  phone: string
  email?: string
  brand: { _id: string; name: string }
  products: { _id: string; name: string }[]
  isActive: boolean
  createdAt: string
}

export function SuppliersContent() {
  const { selectedBrand } = useBrandStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/suppliers/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDeleteOpen(false)
      setDeleteId(null)
      fetchSuppliers()
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBrand) params.set('brand', selectedBrand)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/suppliers?${params}`)
      const json = await res.json()
      setSuppliers(json.data || [])
      setTotalPages(json.totalPages || 1)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, search, page])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <a href="/suppliers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </a>
          <Button variant="outline" size="icon" onClick={fetchSuppliers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No suppliers found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <React.Fragment key={supplier._id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === supplier._id ? null : supplier._id)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {expandedId === supplier._id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            {supplier.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{supplier.company || '-'}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.email || '-'}</TableCell>
                        <TableCell className="text-center">{supplier.products?.length || 0}</TableCell>
                        <TableCell>
                          <Badge className={supplier.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}>
                            {supplier.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <a href={`/suppliers/${supplier._id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <a href={`/suppliers/${supplier._id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleteId(supplier._id); setDeleteOpen(true) }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === supplier._id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Email</p>
                                <p>{supplier.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Address</p>
                                <p>-</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Supplied Products</p>
                                <p className="font-medium">{supplier.products?.length || 0}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Company</p>
                                <p>{supplier.company || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Created</p>
                                <p>{formatDate(supplier.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Phone</p>
                                <p>{supplier.phone}</p>
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
            <DialogTitle>Delete Supplier</DialogTitle>
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
    </div>
  )
}
