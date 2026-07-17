'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils'
import {
  Bell,
  ShoppingBag,
  Package,
  XCircle,
  RotateCcw,
  AlertTriangle,
  CheckCheck,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useBrandStore } from '@/store/useBrandStore'
import type { NotificationType } from '@/types'

interface Notification {
  _id: string
  brand: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

const typeIcons: Record<NotificationType, typeof Bell> = {
  new_order: ShoppingBag,
  low_stock: Package,
  cancelled_order: XCircle,
  return_request: RotateCcw,
  system_alert: AlertTriangle,
}

const typeColors: Record<NotificationType, string> = {
  new_order: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  low_stock: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  cancelled_order: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  return_request: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  system_alert: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const selectedBrand = useBrandStore((s) => s.selectedBrand)

  useEffect(() => {
    ;(async () => {
      try {
        const params = selectedBrand ? `?brand=${selectedBrand}` : ''
        const res = await fetch(`/api/notifications${params}`)
        const json = await res.json()
        setNotifications(json.data || [])
      } catch {
        toast.error('Failed to fetch notifications')
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedBrand])

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: selectedBrand || 'all' }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success('All marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You&apos;re all caught up</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell
                const colorClass = typeColors[notification.type] || 'text-gray-500 bg-gray-100'

                const content = (
                  <div
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
                      !notification.isRead ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                  >
                    <div className={`rounded-full p-2 shrink-0 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                    {notification.link && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
                    )}
                  </div>
                )

                return notification.link ? (
                  <Link key={notification._id} href={notification.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification._id}>{content}</div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
