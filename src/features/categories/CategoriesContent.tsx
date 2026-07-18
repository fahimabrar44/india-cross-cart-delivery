'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { Plus, RefreshCw, Pencil, Trash2, FolderTree } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  _id: string
  name: string
  slug: string
  brand: { _id: string; name: string }
  description?: string
  parent?: { _id: string; name: string }
  isActive: boolean
  createdAt: string
}

interface Brand { _id: string; name: string }

export function CategoriesContent() {
  const { selectedBrand } = useBrandStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    brand: selectedBrand || '',
    description: '',
    parent: '',
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

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
    let mounted = true
    const params = new URLSearchParams()
    if (selectedBrand) params.set('brand', selectedBrand)

    fetch(`/api/categories?${params}`)
      .then(r => r.json())
      .then(json => { if (mounted) setCategories(json.data || []); setLoading(false) })
      .catch(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [selectedBrand, refreshKey])

  function openAdd() {
    setEditing(null)
    setForm({
      name: '',
      brand: selectedBrand || (brands[0]?._id || ''),
      description: '',
      parent: '',
    })
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setForm({
      name: cat.name,
      brand: cat.brand._id,
      description: cat.description || '',
      parent: cat.parent?._id || '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error('Category name is required'); return }

    setSaving(true)
    try {
      if (editing) {
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing._id, name: form.name, description: form.description }),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
        toast.success('Category updated')
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, brand: form.brand, description: form.description, parent: form.parent || undefined }),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error) }
        toast.success('Category created')
      }

      setDialogOpen(false)
      setEditing(null)
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/categories?id=${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Category deleted')
      setDeleteOpen(false)
      setDeleteId(null)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
                  <DialogDescription>
                    {editing ? 'Update the category details' : 'Create a new product category'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {!editing && (
                    <div className="space-y-2">
                      <Label>Brand *</Label>
                      <Select value={form.brand} onValueChange={(v) => setForm({ ...form, brand: v || '' })}>
                        <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                        <SelectContent>
                          {brands.map(b => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <Select value={form.parent} onValueChange={(v) => setForm({ ...form, parent: v || '' })}>
                      <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => editing ? c._id !== editing._id : true).map(c => (
                          <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null) }}>Cancel</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                  <TableHead>Slug</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <FolderTree className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No categories found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cat) => (
                    <TableRow key={cat._id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell>{cat.brand?.name || '-'}</TableCell>
                      <TableCell>{cat.parent?.name || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cat.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={deleteOpen && deleteId === cat._id} onOpenChange={(o) => { if (!o) setDeleteOpen(false) }}>
                            <AlertDialogTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleteId(cat._id); setDeleteOpen(true) }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{cat.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => { setDeleteOpen(false); setDeleteId(null) }}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {saving ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
