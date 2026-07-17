import mongoose, { Schema, Document } from 'mongoose'

export interface ISettingsDocument extends Document {
  brand: mongoose.Types.ObjectId
  key: string
  value: unknown
  createdAt: Date
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

SettingsSchema.index({ brand: 1, key: 1 }, { unique: true })

export default mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema)
