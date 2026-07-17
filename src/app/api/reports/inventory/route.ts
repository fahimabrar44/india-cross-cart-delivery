export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Inventory from '@/models/Inventory'
import Product from '@/models/Product'
import Brand from '@/models/Brand'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')

    const match: Record<string, unknown> = {}
    if (session.user.role !== 'super_admin') {
      match.brand = { $in: session.user.brandAccess }
    }
    if (brand) match.brand = brand

    const inventory = await Inventory.find(match)
      .populate('product', 'name sku purchasePrice sellingPrice stockAlertLimit')
      .populate('brand', 'name')
      .lean()

    const rows = inventory.map((item) => {
      const product = item.product as unknown as { name: string; sku: string; stockAlertLimit: number } | null
      const brandObj = item.brand as unknown as { name: string } | null
      const currentStock = item.currentStock || 0
      const alertLimit = product?.stockAlertLimit || 10

      let status: 'low' | 'ok' | 'overstock'
      if (currentStock === 0) status = 'low'
      else if (currentStock <= alertLimit) status = 'low'
      else if (currentStock > alertLimit * 3) status = 'overstock'
      else status = 'ok'

      return {
        productName: product?.name || 'Unknown',
        sku: product?.sku || '',
        brand: brandObj?.name || '',
        currentStock,
        alertLimit,
        status,
      }
    })

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Inventory report error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

