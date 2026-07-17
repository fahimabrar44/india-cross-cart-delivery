import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUserDocument extends Document {
  name: string
  email: string
  password: string
  role: string
  avatar?: string
  phone?: string
  brandAccess: mongoose.Types.ObjectId[]
  permissions: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'brand_admin', 'order_manager', 'inventory_manager', 'sales_agent', 'account_manager', 'viewer'],
      default: 'viewer',
    },
    avatar: { type: String },
    phone: { type: String, trim: true },
    brandAccess: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}



export default mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema)
