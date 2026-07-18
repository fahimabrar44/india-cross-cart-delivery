import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

export interface ITrackingEvent {
  status: string
  note: string
  timestamp: Date
  updatedBy?: mongoose.Types.ObjectId
}

export interface IOrderDocument extends Document {
  orderNumber: string
  brand: mongoose.Types.ObjectId
  customer?: mongoose.Types.ObjectId
  items: IOrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  codAmount: number
  paidAmount: number
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  status: 'new' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  agent?: mongoose.Types.ObjectId
  courierName?: string
  trackingNumber?: string
  riderPhone?: string
  dispatchDate?: Date
  deliveryDate?: Date
  notes?: string
  trackingEvents: ITrackingEvent[]
  shippingAddress: {
    name: string
    phone: string
    address: string
    district: string
    country: string
  }
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    status: { type: String, required: true },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    codAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['new', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'new',
    },
    agent: { type: Schema.Types.ObjectId, ref: 'User' },
    courierName: { type: String },
    trackingNumber: { type: String },
    riderPhone: { type: String },
    dispatchDate: { type: Date },
    deliveryDate: { type: Date },
    notes: { type: String },
    trackingEvents: [TrackingEventSchema],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      district: { type: String, required: true },
      country: { type: String, default: 'Bangladesh' },
    },
  },
  { timestamps: true }
)

OrderSchema.index({ orderNumber: 1 })
OrderSchema.index({ brand: 1, status: 1 })
OrderSchema.index({ customer: 1 })
OrderSchema.index({ createdAt: -1 })
OrderSchema.index({ orderNumber: 'text', 'shippingAddress.name': 'text', 'shippingAddress.phone': 'text' })

export default mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema)
