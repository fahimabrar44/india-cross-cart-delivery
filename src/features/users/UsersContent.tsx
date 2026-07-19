'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime, getStatusColor } from '@/lib/utils'
import { Plus, Search, UserCog, MoreHorizontal, ExternalLink, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  brand_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  order_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  inventory_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sales_agent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  account_manager: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

interface User {
  _id: string
  name: string
  email: string
  role: string
  brandAccess: { _id: string; name: string }[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export function UsersContent() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/users')
        const json = await res.json()
        setUsers(json.data || [])
      } catch {
        toast.error('Failed to fetch users')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to deactivate "${userName}"?`)) return
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to deactivate user')
      toast.success('User deactivated successfully')
      setUsers((prev) => prev.filter((u) => u._id !== userId))
    } catch {
      toast.error('Failed to deactivate user')
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <Link href="/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Brands Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <UserCog className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || roleColors.viewer}>
                        {user.role.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.brandAccess?.length
                          ? user.brandAccess.map((b) => (
                              <Badge key={b._id} variant="outline" className="text-xs">
                                {b.name}
                              </Badge>
                            ))
                          : <span className="text-sm text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.isActive ? 'active' : 'inactive')}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastLogin ? formatDateTime(user.lastLogin) : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/users/${user._id}`)}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/users/${user._id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(user._id, user.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
