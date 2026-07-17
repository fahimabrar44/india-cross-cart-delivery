import mongoose, { Schema, Document } from 'mongoose'

export interface IAuditLogDocument extends Document {
  brand?: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  action: string
  entity: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

AuditLogSchema.index({ brand: 1, createdAt: -1 })
AuditLogSchema.index({ entity: 1, entityId: 1 })
AuditLogSchema.index({ user: 1 })

export default mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema)
