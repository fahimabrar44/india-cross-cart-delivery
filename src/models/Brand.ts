import mongoose, { Schema, Document } from 'mongoose'

export interface IBrandDocument extends Document {
  name: string
  slug: string
  logo?: string
  favicon?: string
  website?: string
  email?: string
  phone?: string
  address?: string
  currency: string
  currencySymbol: string
  invoiceSettings: {
    prefix: string
    nextNumber: number
    footer?: string
    logo?: string
  }
  status: 'active' | 'inactive' | 'suspended'
  createdAt: Date
  updatedAt: Date
}

const BrandSchema = new Schema<IBrandDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String },
    favicon: { type: String },
    website: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String },
    currency: { type: String, default: 'BDT' },
    currencySymbol: { type: String, default: '৳' },
    invoiceSettings: {
      prefix: { type: String, default: 'INV' },
      nextNumber: { type: Number, default: 1000 },
      footer: { type: String },
      logo: { type: String },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
)

BrandSchema.index({ slug: 1 })
BrandSchema.index({ status: 1 })

export default mongoose.models.Brand || mongoose.model<IBrandDocument>('Brand', BrandSchema)
