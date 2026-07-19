'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface SupplierData {
  _id: string
  companyName: string
  contactPerson: string
  phone: string
  email?: string
  address?: string
  city?: string
  country?: string
  isActive: boolean
  notes?: string
  brand: { _id: string; name: string }
  createdAt: string
}

export function SupplierDetail({ supplierId }: { supplierId: string }) {
  const router = useRouter()
  const [data, setData] = useState<SupplierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/suppliers/${supplierId}`)
      .then(r => {
        if (r.status === 404) throw new Error('NOT_FOUND')
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      })
      .then(json => {
        if (!json.data) throw new Error('NOT_FOUND')
        setData(json.data)
      })
      .catch(err => {
        if (err.message === 'NOT_FOUND') setNotFound(true)
        else toast.error(err.message)
      })
      .finally(() => setLoading(false))
  }, [supplierId])

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Supplier deleted')
      router.push('/suppliers')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Supplier not found</h2>
        <p className="text-muted-foreground">The supplier you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => router.push('/suppliers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/suppliers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{data.companyName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/suppliers/${data._id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </a>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-medium">{data.companyName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{data.contactPerson}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{data.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{data.email || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{data.address || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">City</p>
              <p className="font-medium">{data.city || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="font-medium">{data.country || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Brand</p>
              <p className="font-medium">{data.brand?.name || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={data.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}>
                {data.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(data.createdAt)}</p>
            </div>
          </div>

          {data.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{data.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{data.companyName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
