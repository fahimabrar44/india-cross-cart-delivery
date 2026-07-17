import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Order from '@/models/Order'
import Product from '@/models/Product'
import Customer from '@/models/Customer'
import Inventory from '@/models/Inventory'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const filter: Record<string, unknown> = {}
    if (session.user.role !== 'super_admin' && session.user.brandAccess.length > 0) {
      filter.brand = { $in: session.user.brandAccess }
    }

    const [
      totalOrders,
      todayRevenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockProducts,
      activeCustomers,
      topSelling,
      salesRaw,
    ] = await Promise.all([
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: { ...filter, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
        { $group: { _id: null, total: { $sum: '$codAmount' } } },
      ]),
      Order.countDocuments({ ...filter, status: { $in: ['new', 'confirmed', 'processing', 'packed'] } }),
      Order.countDocuments({ ...filter, status: 'delivered' }),
      Order.countDocuments({ ...filter, status: 'cancelled' }),
      Inventory.countDocuments({ ...filter, currentStock: { $lte: 10 } }),
      Customer.countDocuments(filter),
      Order.aggregate([
        { $match: { ...filter, status: 'delivered' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', total: { $sum: '$items.quantity' } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$codAmount' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ])

    const orderStats = await Order.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    return NextResponse.json({
      totalOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockProducts,
      activeCustomers,
      topSellingProducts: topSelling.map((p) => ({ name: p._id, total: p.total })),
      salesData: salesRaw.map((s) => ({ date: s._id, amount: s.amount })),
      orderStats: orderStats.map((s) => ({ status: s._id, count: s.count })),
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
