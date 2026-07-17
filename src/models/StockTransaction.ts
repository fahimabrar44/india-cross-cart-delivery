import mongoose, { Schema, Document } from 'mongoose'

export interface IStockTransactionDocument extends Document {
  product: mongoose.Types.ObjectId
  warehouse: mongoose.Types.ObjectId
  brand: mongoose.Types.ObjectId
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'damage' | 'return' | 'transfer'
  quantity: number
  previousStock: number
  newStock: number
  reference?: string
  note?: string
  performedBy: mongoose.Types.ObjectId
  createdAt: Date
}

const StockTransactionSchema = new Schema<IStockTransactionDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    type: {
      type: String,
      enum: ['stock_in', 'stock_out', 'adjustment', 'damage', 'return', 'transfer'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reference: { type: String },
    note: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

StockTransactionSchema.index({ product: 1, warehouse: 1 })
StockTransactionSchema.index({ brand: 1 })
StockTransactionSchema.index({ type: 1 })
StockTransactionSchema.index({ createdAt: -1 })

export default mongoose.models.StockTransaction || mongoose.model<IStockTransactionDocument>('StockTransaction', StockTransactionSchema)
