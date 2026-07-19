'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
interface Product { _id: string; name: string; sku: string }

export function SupplierForm({ supplierId }: { supplierId?: string } = {}) {
  const router = useRouter()
  const { selectedBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!supplierId)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    email: '',
    address: '',
    brand: selectedBrand || '',
    products: [] as string[],
  })

  useEffect(() => {
    if (!supplierId) return
    fetch(`/api/suppliers/${supplierId}`)
      .then(r => r.json())
      .then(json => {
        const d = json.data
        if (d) {
          setForm({
            name: d.contactPerson || '',
            phone: d.phone || '',
            company: d.companyName || '',
            email: d.email || '',
            address: d.address || '',
            brand: d.brand?._id || '',
            products: d.products?.map((p: { _id: string }) => p._id) || [],
          })
        }
      })
      .catch(() => toast.error('Failed to load supplier'))
      .finally(() => setFetching(false))
  }, [supplierId])

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
    if (form.brand) {
      fetch(`/api/products?brand=${form.brand}&limit=200`)
        .then(r => r.json())
        .then(json => setProducts(json.data || []))
    }
  }, [form.brand])

  function toggleProduct(id: string) {
    setForm(f => ({
      ...f,
      products: f.products.includes(id)
        ? f.products.filter(p => p !== id)
        : [...f.products, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error('Name and Phone are required')
      return
    }
    if (!form.brand) {
      toast.error('Please select a brand')
      return
    }

    setLoading(true)
    try {
      const url = supplierId ? `/api/suppliers/${supplierId}` : '/api/suppliers'
      const method = supplierId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success(supplierId ? 'Supplier updated' : 'Supplier created')
      router.push('/suppliers')
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
          <h1 className="text-2xl font-bold">Edit Supplier</h1>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
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
        <h1 className="text-2xl font-bold">{supplierId ? 'Edit Supplier' : 'Add Supplier'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Supplier Information</CardTitle></CardHeader>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Supplier name" />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Full address" />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Products</CardTitle></CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products found for this brand</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {products.map(p => (
                  <label
                    key={p._id}
                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${form.products.includes(p._id) ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.products.includes(p._id)}
                      onChange={() => toggleProduct(p._id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {supplierId ? 'Update Supplier' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </div>
  )
}
