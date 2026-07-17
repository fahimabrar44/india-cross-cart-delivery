import mongoose, { Schema, Document } from 'mongoose'

export interface ICategoryDocument extends Document {
  name: string
  slug: string
  brand: mongoose.Types.ObjectId
  description?: string
  parent?: mongoose.Types.ObjectId
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    description: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CategorySchema.index({ slug: 1, brand: 1 }, { unique: true })
CategorySchema.index({ brand: 1 })

export default mongoose.models.Category || mongoose.model<ICategoryDocument>('Category', CategorySchema)
