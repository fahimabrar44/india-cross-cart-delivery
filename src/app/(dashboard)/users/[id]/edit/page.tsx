'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { ROLES, ROLE_PERMISSIONS } from '@/config/constants'
import Link from 'next/link'

interface Brand {
  _id: string
  name: string
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    brandAccess: [] as string[],
  })

  useEffect(() => {
    ;(async () => {
      const { id } = await params
      setId(id)
      try {
        const [userRes, brandsRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch('/api/brands'),
        ])
        if (!userRes.ok) throw new Error('Failed to fetch user')
        const userJson = await userRes.json()
        const user = userJson.data
        setForm({
          name: user.name || '',
          email: user.email || '',
          password: '',
          role: user.role || 'viewer',
          brandAccess: (user.brandAccess || []).map((b: { _id: string }) => b._id),
        })
        const brandsJson = await brandsRes.json()
        setBrands(brandsJson.data || [])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load user')
      } finally {
        setLoading(false)
      }
    })()
  }, [params])

  function toggleBrand(brandId: string) {
    setForm((prev) => ({
      ...prev,
      brandAccess: prev.brandAccess.includes(brandId)
        ? prev.brandAccess.filter((b) => b !== brandId)
        : [...prev.brandAccess, brandId],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        brandAccess: form.brandAccess,
      }
      if (form.password.trim()) body.password = form.password

      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update user')
      toast.success('User updated successfully')
      router.push('/users')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const selectedRolePermissions = ROLE_PERMISSIONS[form.role] || []

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v || 'viewer' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ROLES).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Access</CardTitle>
              </CardHeader>
              <CardContent>
                {brands.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No brands available</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {brands.map((brand) => (
                      <label
                        key={brand._id}
                        className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={form.brandAccess.includes(brand._id)}
                          onCheckedChange={() => toggleBrand(brand._id)}
                        />
                        <span className="text-sm font-medium">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRolePermissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No permissions for this role</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedRolePermissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {perm.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/users">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
