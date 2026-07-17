import mongoose, { Schema, Document } from 'mongoose'

export interface INotificationDocument extends Document {
  brand: mongoose.Types.ObjectId
  type: 'new_order' | 'low_stock' | 'cancelled_order' | 'return_request' | 'system_alert'
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: Date
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    type: {
      type: String,
      enum: ['new_order', 'low_stock', 'cancelled_order', 'return_request', 'system_alert'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

NotificationSchema.index({ brand: 1, isRead: 1 })
NotificationSchema.index({ createdAt: -1 })

export default mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', NotificationSchema)
