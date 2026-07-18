export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Inventory from '@/models/Inventory'
import StockTransaction from '@/models/StockTransaction'
import '@/models/Product'
import '@/models/Warehouse'
import '@/models/Brand'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const warehouse = searchParams.get('warehouse')

    const filter: Record<string, unknown> = {}
    if (brand) filter.brand = brand
    if (warehouse) filter.warehouse = warehouse

    if (session.user.role !== 'super_admin' && !brand) {
      filter.brand = { $in: session.user.brandAccess }
    }

    const data = await Inventory.find(filter)
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .populate('brand', 'name')
      .sort({ updatedAt: -1 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()
    const { type, product, warehouse, brand, quantity, note } = body

    if (!product || !warehouse || !brand || !type || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'stock_in' && quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive for stock in' }, { status: 400 })
    }
    if (type === 'stock_out' && quantity >= 0) {
      return NextResponse.json({ error: 'Quantity must be negative for stock out' }, { status: 400 })
    }

    let inventory = await Inventory.findOne({ product, warehouse })

    if (!inventory) {
      inventory = await Inventory.create({ product, warehouse, brand, openingStock: 0, currentStock: 0 })
    }

    const previousStock = inventory.currentStock
    const newStock = previousStock + quantity

    if (newStock < 0) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    inventory.currentStock = newStock
    await inventory.save()

    await StockTransaction.create({
      product,
      warehouse,
      brand,
      type,
      quantity,
      previousStock,
      newStock,
      note,
      performedBy: session.user.id,
    })

    return NextResponse.json({ data: inventory }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

