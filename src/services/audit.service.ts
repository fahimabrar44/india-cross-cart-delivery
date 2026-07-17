import { connectDB } from '@/config/db'
import AuditLog from '@/models/AuditLog'

export async function createAuditLog(params: {
  brand?: string
  user: string
  action: string
  entity: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}) {
  await connectDB()
  return AuditLog.create(params)
}

export async function getAuditLogs(params: {
  brand?: string
  entity?: string
  entityId?: string
  limit?: number
  page?: number
}) {
  await connectDB()
  const query: Record<string, unknown> = {}
  if (params.brand) query.brand = params.brand
  if (params.entity) query.entity = params.entity
  if (params.entityId) query.entityId = params.entityId

  const page = params.page || 1
  const limit = params.limit || 50
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    AuditLog.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}
