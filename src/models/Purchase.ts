import mongoose, { Schema, Document } from 'mongoose'

export interface IPurchaseItem {
  product: mongoose.Types.ObjectId
  name: string
  sku: string
  quantity: number
  cost: number
  total: number
}

export interface IPurchaseDocument extends Document {
  invoiceNumber: string
  brand: mongoose.Types.ObjectId
  supplier: mongoose.Types.ObjectId
  items: IPurchaseItem[]
  subtotal: number
  discount: number
  total: number
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  notes?: string
  purchaseDate: Date
  createdAt: Date
  updatedAt: Date
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    cost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const PurchaseSchema = new Schema<IPurchaseDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
    },
    notes: { type: String },
    purchaseDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

PurchaseSchema.index({ invoiceNumber: 1 })
PurchaseSchema.index({ brand: 1 })
PurchaseSchema.index({ supplier: 1 })

export default mongoose.models.Purchase || mongoose.model<IPurchaseDocument>('Purchase', PurchaseSchema)
