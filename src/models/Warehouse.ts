import mongoose, { Schema, Document } from 'mongoose'

export interface IWarehouseDocument extends Document {
  name: string
  brand: mongoose.Types.ObjectId
  manager?: string
  phone?: string
  email?: string
  address?: string
  location?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const WarehouseSchema = new Schema<IWarehouseDocument>(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    manager: { type: String },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String },
    location: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

WarehouseSchema.index({ name: 1, brand: 1 }, { unique: true })
WarehouseSchema.index({ brand: 1 })

export default mongoose.models.Warehouse || mongoose.model<IWarehouseDocument>('Warehouse', WarehouseSchema)
