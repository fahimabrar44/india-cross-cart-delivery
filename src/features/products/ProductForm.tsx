'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import { useBrandStore } from '@/store/useBrandStore'
import { generateSku } from '@/lib/utils'
import Image from 'next/image'

interface Brand { _id: string; name: string; slug: string }
interface Category { _id: string; name: string }

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter()
  const { selectedBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!productId)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', brand: selectedBrand || '',
    category: '', description: '', purchasePrice: '', sellingPrice: '',
    stockAlertLimit: '10',
  })

  useEffect(() => { fetchBrands() }, [])
  useEffect(() => { if (form.brand) fetchCategories(form.brand) }, [form.brand])
  useEffect(() => { if (productId) fetchProduct() }, [productId])

  async function fetchBrands() {
    const res = await fetch('/api/brands')
    const json = await res.json()
    setBrands(json.data || [])
    if (json.data?.length && !form.brand) {
      setForm(f => ({ ...f, brand: json.data[0]._id }))
    }
  }

  async function fetchCategories(brandId: string) {
    const res = await fetch(`/api/categories?brand=${brandId}`)
    const json = await res.json()
    setCategories(json.data || [])
  }

  async function fetchProduct() {
    const res = await fetch(`/api/products/${productId}`)
    const json = await res.json()
    if (json.data) {
      const p = json.data
      setForm({
        name: p.name, sku: p.sku, barcode: p.barcode || '',
        brand: p.brand._id || p.brand, category: p.category?._id || p.category || '',
        description: p.description || '', purchasePrice: String(p.purchasePrice),
        sellingPrice: String(p.sellingPrice), stockAlertLimit: String(p.stockAlertLimit),
      })
      setImages(p.images || [])
    }
    setFetching(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'mb-oms/products')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) setImages(prev => [...prev, json.url])
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.sku || !form.sellingPrice) {
      toast.error('Name, SKU, and Selling Price are required')
      return
    }
    setLoading(true)
    try {
      const body = {
        ...form,
        purchasePrice: Number(form.purchasePrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
        stockAlertLimit: Number(form.stockAlertLimit) || 10,
        images,
      }

      const url = productId ? `/api/products/${productId}` : '/api/products'
      const method = productId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
      toast.success(productId ? 'Product updated' : 'Product created')
      router.push('/products')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally { setLoading(false) }
  }

  if (fetching) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>

  const brand = brands.find(b => b._id === form.brand)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{productId ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => setForm({
                ...form, name: e.target.value,
                sku: e.target.value && brand ? generateSku(brand.slug, e.target.value) : form.sku
              })} placeholder="Product name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated" />
              </div>
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <Input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Selling Price *</Label>
                <Input type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} min="0" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label>Stock Alert Limit</Label>
                <Input type="number" value={form.stockAlertLimit} onChange={e => setForm({ ...form, stockAlertLimit: e.target.value })} min="0" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>Images</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              {images.map((url, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg border overflow-hidden group">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Label className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-4 py-2 hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload Image'}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </Label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {productId ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}
