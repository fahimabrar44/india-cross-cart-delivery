export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import StockTransaction from '@/models/StockTransaction'
import '@/models/Product'
import '@/models/Warehouse'
import '@/models/Brand'
import '@/models/User'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const product = searchParams.get('product')
    const warehouse = searchParams.get('warehouse')
    const brand = searchParams.get('brand')

    if (!product && !warehouse) {
      return NextResponse.json({ error: 'Product or warehouse filter required' }, { status: 400 })
    }

    const filter: Record<string, unknown> = {}
    if (product) filter.product = product
    if (warehouse) filter.warehouse = warehouse
    if (brand) filter.brand = brand

    if (session.user.role !== 'super_admin' && !brand) {
      filter.brand = { $in: session.user.brandAccess }
    }

    const data = await StockTransaction.find(filter)
      .populate('product', 'name sku')
      .populate('warehouse', 'name')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(200)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
  }
}
