export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Order from '@/models/Order'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const match: Record<string, unknown> = {}

    if (session.user.role !== 'super_admin') {
      match.brand = { $in: session.user.brandAccess }
    }
    if (brand) match.brand = brand

    const dateFilter: Record<string, unknown> = {}
    if (from) dateFilter.$gte = new Date(from)
    if (to) dateFilter.$lte = new Date(to + 'T23:59:59.999Z')
    if (Object.keys(dateFilter).length) match.createdAt = dateFilter

    const daily = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          ordersCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          codAmount: { $sum: '$codAmount' },
          discount: { $sum: '$discount' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const summary = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalCod: { $sum: '$codAmount' },
          totalDiscount: { $sum: '$discount' },
        },
      },
    ])

    return NextResponse.json({
      daily: daily.map((d) => ({
        date: d._id,
        ordersCount: d.ordersCount,
        totalRevenue: d.totalRevenue,
        codAmount: d.codAmount,
        discount: d.discount,
      })),
      summary: summary[0] || { totalOrders: 0, totalRevenue: 0, totalCod: 0, totalDiscount: 0 },
    })
  } catch (error) {
    console.error('Sales report error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

