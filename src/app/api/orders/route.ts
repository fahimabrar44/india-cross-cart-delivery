export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Order from '@/models/Order'
import Brand from '@/models/Brand'
import { createAuditLog } from '@/services/audit.service'
import { createNotification } from '@/services/notification.service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (brand) filter.brand = brand
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } },
      ]
    }

    if (session.user.role !== 'super_admin') {
      filter.brand = { $in: session.user.brandAccess }
    }

    const [data, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name phone')
        .populate('agent', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()

    const brand = await Brand.findById(body.brand)
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    const orderNumber = `${brand.invoiceSettings.prefix}-${String(brand.invoiceSettings.nextNumber).padStart(6, '0')}`

    await Brand.findByIdAndUpdate(body.brand, {
      'invoiceSettings.nextNumber': brand.invoiceSettings.nextNumber + 1,
    })

    const order = await Order.create({
      ...body,
      orderNumber,
      status: 'new',
      paymentStatus: body.paymentStatus || 'pending',
      codAmount: body.codAmount || body.total || 0,
    })

    await createNotification({
      brand: body.brand,
      type: 'new_order',
      title: 'New Order Created',
      message: `Order ${orderNumber} has been created`,
      link: `/orders/${order._id}`,
    })

    await createAuditLog({
      user: session.user.id,
      action: 'create_order',
      entity: 'Order',
      entityId: order._id.toString(),
      after: { orderNumber: order.orderNumber, total: order.total },
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('Order create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

