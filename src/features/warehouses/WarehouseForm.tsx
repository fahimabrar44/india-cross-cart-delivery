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
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useBrandStore } from '@/store/useBrandStore'

interface Brand { _id: string; name: string }

interface WarehouseFormProps {
  warehouseId?: string
}

export function WarehouseForm({ warehouseId }: WarehouseFormProps = {}) {
  const router = useRouter()
  const { selectedBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!warehouseId)

  const [form, setForm] = useState({
    name: '',
    brand: selectedBrand || '',
    manager: '',
    phone: '',
    email: '',
    address: '',
    location: '',
  })

  const isEditing = !!warehouseId

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(json => {
        setBrands(json.data || [])
        if (!form.brand && json.data?.length) {
          setForm(f => ({ ...f, brand: json.data[0]._id }))
        }
      })
  }, [])

  useEffect(() => {
    if (!warehouseId) return
    fetch(`/api/warehouses/${warehouseId}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setForm({
            name: json.data.name || '',
            brand: json.data.brand?._id || '',
            manager: json.data.manager || '',
            phone: json.data.phone || '',
            email: json.data.email || '',
            address: json.data.address || '',
            location: json.data.location || '',
          })
        }
      })
      .catch(() => toast.error('Failed to load warehouse'))
      .finally(() => setFetching(false))
  }, [warehouseId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.brand) {
      toast.error('Name and Brand are required')
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/warehouses/${warehouseId}` : '/api/warehouses'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success(isEditing ? 'Warehouse updated' : 'Warehouse created')
      router.push('/warehouses')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Warehouse' : 'Add Warehouse'}</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Warehouse' : 'Add Warehouse'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Warehouse Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v || '' })}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dhaka Main Warehouse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manager</Label>
                <Input
                  value={form.manager}
                  onChange={e => setForm({ ...form, manager: e.target.value })}
                  placeholder="Manager name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Gulshan, Dhaka"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                rows={2}
                placeholder="Full address"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Warehouse' : 'Create Warehouse'}
          </Button>
        </div>
      </form>
    </div>
  )
}
