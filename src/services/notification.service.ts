import { connectDB } from '@/config/db'
import Notification from '@/models/Notification'

export async function createNotification(params: {
  brand: string
  type: 'new_order' | 'low_stock' | 'cancelled_order' | 'return_request' | 'system_alert'
  title: string
  message: string
  link?: string
}) {
  await connectDB()
  return Notification.create(params)
}

export async function getNotifications(brand: string, limit = 20) {
  await connectDB()
  return Notification.find({ brand }).sort({ createdAt: -1 }).limit(limit)
}

export async function getUnreadCount(brand: string) {
  await connectDB()
  return Notification.countDocuments({ brand, isRead: false })
}

export async function markAsRead(id: string) {
  await connectDB()
  return Notification.findByIdAndUpdate(id, { isRead: true })
}

export async function markAllAsRead(brand: string) {
  await connectDB()
  return Notification.updateMany({ brand, isRead: false }, { isRead: true })
}
