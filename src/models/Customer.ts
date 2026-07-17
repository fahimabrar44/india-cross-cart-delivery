import mongoose, { Schema, Document } from 'mongoose'

export interface ICustomerDocument extends Document {
  name: string
  phone: string
  whatsapp?: string
  email?: string
  address?: string
  district?: string
  country?: string
  brand: mongoose.Types.ObjectId
  totalPurchases: number
  totalOrders: number
  isBlacklisted: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    district: { type: String },
    country: { type: String, default: 'Bangladesh' },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    totalPurchases: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    isBlacklisted: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
)

CustomerSchema.index({ phone: 1, brand: 1 }, { unique: true })
CustomerSchema.index({ brand: 1 })
CustomerSchema.index({ name: 'text', phone: 'text', email: 'text' })

export default mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema)
