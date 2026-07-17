import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Purchase from '@/models/Purchase'
import { createAuditLog } from '@/services/audit.service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const data = await Purchase.findById(id)
      .populate('brand', 'name currencySymbol')
      .populate('supplier', 'name company phone')
      .populate('items.product', 'name sku')
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data })
  } catch (error) {
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

    const update: Record<string, unknown> = {}
    if (body.paymentStatus) update.paymentStatus = body.paymentStatus
    if (body.notes !== undefined) update.notes = body.notes
    if (body.discount !== undefined) {
      update.discount = body.discount
      const purchase = await Purchase.findById(id)
      if (purchase) {
        update.total = Math.max(0, purchase.subtotal - body.discount)
      }
    }

    const data = await Purchase.findByIdAndUpdate(id, update, { new: true })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await createAuditLog({
      brand: data.brand.toString(),
      user: session.user.id,
      action: 'update_purchase',
      entity: 'Purchase',
      entityId: data._id.toString(),
      after: { paymentStatus: data.paymentStatus, total: data.total },
    })

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    await Purchase.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
