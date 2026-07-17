export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import User from '@/models/User'
import { createAuditLog } from '@/services/audit.service'
import { ROLE_PERMISSIONS } from '@/config/constants'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const brand = searchParams.get('brand')

    const filter: Record<string, unknown> = {}
    if (role) filter.role = role
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    if (brand) filter.brandAccess = { $in: [brand] }

    if (session.user.role !== 'super_admin') {
      filter.brandAccess = { $in: session.user.brandAccess }
    }

    const users = await User.find(filter)
      .populate('brandAccess', 'name')
      .sort({ createdAt: -1 })
      .lean()

    const sanitized = users.map((u) => {
      const doc = { ...u as Record<string, unknown> }
      delete doc.password
      return doc
    })

    return NextResponse.json({ data: sanitized })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()
    const body = await request.json()

    const existing = await User.findOne({ email: body.email })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const permissions = ROLE_PERMISSIONS[body.role] || []

    const user = await User.create({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      brandAccess: body.brandAccess || [],
      permissions,
      isActive: true,
    })

    await createAuditLog({
      user: session.user.id,
      action: 'create_user',
      entity: 'User',
      entityId: user._id.toString(),
      after: { name: user.name, email: user.email, role: user.role },
    })

    const sanitized = { ...user.toObject() as Record<string, unknown> }
    delete sanitized.password
    return NextResponse.json({ data: sanitized }, { status: 201 })
  } catch (error) {
    console.error('User create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

