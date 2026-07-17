import mongoose, { Schema, Document } from 'mongoose'

export interface IProductDocument extends Document {
  name: string
  sku: string
  barcode?: string
  brand: mongoose.Types.ObjectId
  category?: mongoose.Types.ObjectId
  description?: string
  purchasePrice: number
  sellingPrice: number
  images: string[]
  stockAlertLimit: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    stockAlertLimit: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

ProductSchema.index({ sku: 1, brand: 1 }, { unique: true })
ProductSchema.index({ brand: 1 })
ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' })

export default mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema)
