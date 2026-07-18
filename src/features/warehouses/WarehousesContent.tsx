'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { ChevronDown, ChevronRight, Warehouse, Plus, RefreshCw, Building2, Phone, User, Eye, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WarehouseItem {
  _id: string
  name: string
  brand: { _id: string; name: string }
  manager?: string
  phone?: string
  email?: string
  address?: string
  location?: string
  isActive: boolean
}

export function WarehousesContent() {
  const router = useRouter()
  const { selectedBrand } = useBrandStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/warehouses/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDeleteOpen(false)
      setDeleteId(null)
      setRefreshKey((k) => k + 1)
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const params = new URLSearchParams()
    if (selectedBrand) params.set('brand', selectedBrand)

    fetch(`/api/warehouses?${params}`)
      .then((res) => res.json())
      .then((json) => { if (mounted) { setWarehouses(json.data || []); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [selectedBrand, refreshKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Warehouses</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <Button onClick={() => router.push('/warehouses/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
          <Button variant="outline" size="icon" onClick={() => setRefreshKey((k) => k + 1)}>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Warehouse className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No warehouses found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouses.map((w) => (
                    <React.Fragment key={w._id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpandedId(expandedId === w._id ? null : w._id)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {expandedId === w._id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {w.name}
                          </div>
                        </TableCell>
                        <TableCell>{w.brand?.name || '-'}</TableCell>
                        <TableCell>
                          {w.manager ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {w.manager}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {w.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {w.phone}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            w.isActive
                              ?                           'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {w.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <a href={`/warehouses/${w._id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <a href={`/warehouses/${w._id}/edit`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleteId(w._id); setDeleteOpen(true) }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === w._id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Address</p>
                                <p>{w.address || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Email</p>
                                <p>{w.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Location</p>
                                <p>{w.location || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Brand</p>
                                <p>{w.brand?.name || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Manager</p>
                                <p>{w.manager || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Contact</p>
                                <p>{w.phone || '-'}</p>
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

      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteId(null) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Warehouse</DialogTitle>
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
