'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit, Trash2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface BrandDetailData {
  _id: string
  name: string
  description?: string
  logo?: string
  isActive: boolean
  status: string
  createdAt: string
}

export function BrandDetail({ brandId }: { brandId: string }) {
  const router = useRouter()
  const [brand, setBrand] = useState<BrandDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBrand()
  }, [brandId])

  async function fetchBrand() {
    try {
      const res = await fetch(`/api/brands/${brandId}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch brand')
      const json = await res.json()
      setBrand(json.data)
    } catch {
      toast.error('Failed to fetch brand details')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete brand')
      toast.success('Brand deleted successfully')
      router.push('/settings')
    } catch {
      toast.error('Failed to delete brand')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notFound || !brand) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/settings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Brand Not Found</h2>
            <p className="text-muted-foreground mb-4">The brand you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/settings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/settings')}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-16 w-16 rounded-lg object-cover border"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-2xl">{brand.name}</CardTitle>
              <Badge className="mt-1" variant={brand.isActive ? 'default' : 'secondary'}>
                {brand.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {brand.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p>{brand.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <Badge variant={brand.isActive ? 'default' : 'secondary'}>
                {brand.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
              <p>{formatDate(brand.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
