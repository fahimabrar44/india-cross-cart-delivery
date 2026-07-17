export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import User from '@/models/User'
import { createAuditLog } from '@/services/audit.service'
import { ROLE_PERMISSIONS } from '@/config/constants'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { id } = await params
    const user = await User.findById(id).populate('brandAccess', 'name').lean()
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const sanitized = { ...user as Record<string, unknown> }
    delete sanitized.password
    return NextResponse.json({ data: sanitized })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    const body = await request.json()

    const update: Record<string, unknown> = {}
    if (body.name) update.name = body.name
    if (body.email) update.email = body.email
    if (body.role) {
      update.role = body.role
      update.permissions = ROLE_PERMISSIONS[body.role] || []
    }
    if (body.brandAccess) update.brandAccess = body.brandAccess
    if (typeof body.isActive === 'boolean') update.isActive = body.isActive
    if (body.password) update.password = body.password

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate('brandAccess', 'name')
      .lean()

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await createAuditLog({
      user: session.user.id,
      action: 'update_user',
      entity: 'User',
      entityId: id,
      after: { name: user.name, email: user.email, role: user.role },
    })

    const sanitized = { ...user as Record<string, unknown> }
    delete sanitized.password
    return NextResponse.json({ data: sanitized })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()
    const { id } = await params
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true })

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await createAuditLog({
      user: session.user.id,
      action: 'deactivate_user',
      entity: 'User',
      entityId: id,
      after: { isActive: false },
    })

    return NextResponse.json({ data: { message: 'User deactivated' } })
  } catch (error) {
    console.error('User delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
