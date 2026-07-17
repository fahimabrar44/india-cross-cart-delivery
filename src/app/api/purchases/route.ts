export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Purchase from '@/models/Purchase'
import Brand from '@/models/Brand'
import { createAuditLog } from '@/services/audit.service'
import mongoose from 'mongoose'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const supplier = searchParams.get('supplier')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (brand) filter.brand = brand
    if (supplier) filter.supplier = supplier

    if (session.user.role !== 'super_admin') {
      filter.brand = { $in: session.user.brandAccess }
    }

    const [data, total] = await Promise.all([
      Purchase.find(filter)
        .populate('brand', 'name currencySymbol')
        .populate('supplier', 'name company')
        .populate('items.product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(filter),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Purchases fetch error:', error)
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

    const prefix = brand.invoiceSettings?.prefix || 'PUR'
    let nextNumber = brand.invoiceSettings?.nextNumber || 1000

    const invoiceNumber = `PUR-${prefix}-${String(nextNumber).padStart(5, '0')}`

    const items = body.items.map((item: { product: string; name: string; sku: string; quantity: number; cost: number }) => ({
      product: new mongoose.Types.ObjectId(item.product),
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      cost: item.cost,
      total: item.quantity * item.cost,
    }))

    const subtotal = items.reduce((sum: number, i: { total: number }) => sum + i.total, 0)
    const discount = body.discount || 0
    const total = Math.max(0, subtotal - discount)

    const purchase = await Purchase.create({
      invoiceNumber,
      brand: body.brand,
      supplier: body.supplier,
      items,
      subtotal,
      discount,
      total,
      paymentStatus: body.paymentStatus || 'pending',
      notes: body.notes,
      purchaseDate: body.purchaseDate || new Date(),
    })

    await Brand.findByIdAndUpdate(body.brand, {
      'invoiceSettings.nextNumber': nextNumber + 1,
    })

    await createAuditLog({
      brand: body.brand,
      user: session.user.id,
      action: 'create_purchase',
      entity: 'Purchase',
      entityId: purchase._id.toString(),
      after: { invoiceNumber, total },
    })

    return NextResponse.json({ data: purchase }, { status: 201 })
  } catch (error) {
    console.error('Purchase create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

