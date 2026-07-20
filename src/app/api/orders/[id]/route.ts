export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Order from '@/models/Order'
import { createAuditLog } from '@/services/audit.service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const data = await Order.findById(id)
      .populate('customer', 'name phone email address district callLogs')
      .populate('agent', 'name email')
      .populate('brand', 'name currency currencySymbol')
      .populate('trackingEvents.updatedBy', 'name')
      .populate('callLogs.userId', 'name')
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const body = await request.json()

    const existing = await Order.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const allowedFields = ['status', 'paymentStatus', 'courierName', 'trackingNumber', 'riderPhone', 'dispatchDate', 'deliveryDate', 'notes', 'discount', 'shipping', 'paidAmount']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    if (body.status && body.status !== existing.status) {
      updateData.$push = {
        trackingEvents: {
          status: body.status,
          note: body.trackingNote || '',
          timestamp: new Date(),
          updatedBy: session.user.id,
        },
      }
    }

    const updated = await Order.findByIdAndUpdate(id, updateData, { new: true })
      .populate('customer', 'name phone')
      .populate('agent', 'name')
      .populate('brand', 'name')
      .populate('trackingEvents.updatedBy', 'name')
      .populate('callLogs.userId', 'name')

    const before: Record<string, unknown> = {}
    const after: Record<string, unknown> = {}
    for (const field of allowedFields) {
      before[field] = existing.get(field)
      after[field] = body[field] !== undefined ? body[field] : existing.get(field)
    }

    await createAuditLog({
      brand: existing.brand.toString(),
      user: session.user.id,
      action: 'update_order',
      entity: 'Order',
      entityId: id,
      before,
      after,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    await Order.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
