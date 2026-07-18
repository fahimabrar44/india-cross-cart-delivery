'use client'

import { useEffect, useState } from 'react'
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
import { Warehouse, Plus, RefreshCw, Building2, Phone, User } from 'lucide-react'

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
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Warehouse className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No warehouses found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouses.map((w) => (
                    <TableRow key={w._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
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
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {w.isActive ? 'Active' : 'Inactive'}
                        </span>
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
