import mongoose, { Schema, Document } from 'mongoose'

export interface IInventoryDocument extends Document {
  product: mongoose.Types.ObjectId
  warehouse: mongoose.Types.ObjectId
  brand: mongoose.Types.ObjectId
  openingStock: number
  currentStock: number
  createdAt: Date
  updatedAt: Date
}

const InventorySchema = new Schema<IInventoryDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    openingStock: { type: Number, default: 0, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

InventorySchema.index({ product: 1, warehouse: 1 }, { unique: true })
InventorySchema.index({ brand: 1 })
InventorySchema.index({ currentStock: 1 })

export default mongoose.models.Inventory || mongoose.model<IInventoryDocument>('Inventory', InventorySchema)
