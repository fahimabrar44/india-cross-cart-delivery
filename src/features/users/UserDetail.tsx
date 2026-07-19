'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Edit, Trash2, Mail, Shield, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, getStatusColor } from '@/lib/utils'

interface BrandAccess {
  _id: string
  name: string
}

interface UserDetailData {
  _id: string
  name: string
  email: string
  role: string
  brandAccess: BrandAccess[]
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  brand_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  order_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  inventory_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sales_agent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  account_manager: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export function UserDetail({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    try {
      const res = await fetch(`/api/users/${userId}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error('Failed to fetch user')
      const json = await res.json()
      setUser(json.data)
    } catch {
      toast.error('Failed to fetch user details')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to deactivate user')
      toast.success('User deactivated successfully')
      router.push('/users')
    } catch {
      toast.error('Failed to deactivate user')
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

  if (notFound || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserCog className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">The user you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button onClick={() => router.push('/users')}>Go to Users</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/users/${userId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deactivating...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCog className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <Badge className={`mt-1 ${roleColors[user.role] || roleColors.viewer}`}>
                {user.role.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </h3>
              <p>{user.email}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </h3>
              <Badge className={roleColors[user.role] || roleColors.viewer}>
                {user.role.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <Badge className={getStatusColor(user.isActive ? 'active' : 'inactive')}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p>{formatDate(user.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Last Login</h3>
              <p>{user.lastLogin ? formatDate(user.lastLogin) : '-'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Brand Access</h3>
              {user.brandAccess?.length ? (
                <div className="flex flex-wrap gap-1">
                  {user.brandAccess.map((b) => (
                    <Badge key={b._id} variant="outline" className="text-xs">
                      {b.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No brand access</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
