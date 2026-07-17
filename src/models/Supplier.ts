import mongoose, { Schema, Document } from 'mongoose'

export interface ISupplierDocument extends Document {
  name: string
  phone: string
  company?: string
  email?: string
  address?: string
  brand: mongoose.Types.ObjectId
  products: mongoose.Types.ObjectId[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

SupplierSchema.index({ phone: 1, brand: 1 }, { unique: true })
SupplierSchema.index({ brand: 1 })

export default mongoose.models.Supplier || mongoose.model<ISupplierDocument>('Supplier', SupplierSchema)
