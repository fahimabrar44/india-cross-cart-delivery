export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Order from '@/models/Order'
import Product from '@/models/Product'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const match: Record<string, unknown> = { status: 'delivered' }

    if (session.user.role !== 'super_admin') {
      match.brand = { $in: session.user.brandAccess }
    }
    if (brand) match.brand = brand

    const dateFilter: Record<string, unknown> = {}
    if (from) dateFilter.$gte = new Date(from)
    if (to) dateFilter.$lte = new Date(to + 'T23:59:59.999Z')
    if (Object.keys(dateFilter).length) match.createdAt = dateFilter

    const products = await Product.find({}).populate('brand', 'name').lean()

    const productMap = new Map(products.map((p) => [p._id.toString(), p]))

    const aggregation = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          qtySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' },
        },
      },
      { $sort: { revenue: -1 } },
    ])

    const rows = aggregation.map((item) => {
      const product = productMap.get(item._id.toString())
      const cost = product ? product.purchasePrice * item.qtySold : 0
      const profit = item.revenue - cost
      const margin = item.revenue > 0 ? (profit / item.revenue) * 100 : 0

      return {
        productName: product?.name || 'Unknown Product',
        brand: (product as { brand?: { name?: string } })?.brand && typeof (product as { brand: unknown }).brand === 'object'
          ? ((product as { brand: { name: string } }).brand.name)
          : '',
        qtySold: item.qtySold,
        revenue: item.revenue,
        cost,
        profit,
        margin: Math.round(margin * 100) / 100,
      }
    })

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Profit report error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

