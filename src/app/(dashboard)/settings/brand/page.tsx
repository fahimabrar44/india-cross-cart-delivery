'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BrandSettingsPage() {
  const searchParams = useSearchParams()
  const brandId = searchParams.get('id')
  const [brands, setBrands] = useState<{ _id: string; name: string }[]>([])
  const [selectedId, setSelectedId] = useState(brandId || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'BDT',
    currencySymbol: '৳',
    invoicePrefix: 'INV',
    invoiceNextNumber: 1000,
    invoiceFooter: '',
  })

  useEffect(() => {
    fetch('/api/brands')
      .then((res) => res.json())
      .then((json) => {
        const data = json.data || []
        setBrands(data)
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0]._id)
        }
      })
      .catch(() => toast.error('Failed to load brands'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedId) return
    fetch(`/api/brands/${selectedId}`)
      .then((res) => res.json())
      .then((json) => {
        const b = json.data
        if (b) {
          setForm({
            name: b.name || '',
            email: b.email || '',
            phone: b.phone || '',
            address: b.address || '',
            currency: b.currency || 'BDT',
            currencySymbol: b.currencySymbol || '৳',
            invoicePrefix: b.invoiceSettings?.prefix || 'INV',
            invoiceNextNumber: b.invoiceSettings?.nextNumber || 1000,
            invoiceFooter: b.invoiceSettings?.footer || '',
          })
        }
      })
      .catch(() => toast.error('Failed to load brand details'))
  }, [selectedId])

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/brands/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          currency: form.currency,
          currencySymbol: form.currencySymbol,
          invoiceSettings: {
            prefix: form.invoicePrefix,
            nextNumber: form.invoiceNextNumber,
            footer: form.invoiceFooter,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Brand Settings</h1>
      </div>

      <div className="space-y-2">
        <Label>Select Brand</Label>
        <Select value={selectedId} onValueChange={(v) => setSelectedId(v || '')}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Choose a brand" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => {
                const val = v || 'BDT'
                const sym = val === 'USD' ? '$' : val === 'INR' ? '₹' : '৳'
                setForm({ ...form, currency: val, currencySymbol: sym })
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BDT">BDT (৳)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Next Invoice Number</Label>
              <Input
                type="number"
                value={form.invoiceNextNumber}
                onChange={(e) => setForm({ ...form, invoiceNextNumber: parseInt(e.target.value) || 1000 })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Invoice Footer Text</Label>
            <Textarea
              value={form.invoiceFooter}
              onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
              rows={3}
              placeholder="Thank you for your business!"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
