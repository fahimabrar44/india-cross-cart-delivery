import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Product from '@/models/Product'
import { createAuditLog } from '@/services/audit.service'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (brand) filter.brand = brand
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ]
    }

    if (session.user.role !== 'super_admin') {
      filter.brand = { $in: session.user.brandAccess }
    }

    const [data, total] = await Promise.all([
      Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()

    const product = await Product.create({
      name: body.name,
      sku: body.sku,
      barcode: body.barcode,
      brand: body.brand,
      category: body.category,
      description: body.description,
      purchasePrice: body.purchasePrice,
      sellingPrice: body.sellingPrice,
      images: body.images || [],
      stockAlertLimit: body.stockAlertLimit || 10,
      isActive: true,
    })

    await createAuditLog({
      user: session.user.id,
      action: 'create_product',
      entity: 'Product',
      entityId: product._id.toString(),
      after: { name: product.name, sku: product.sku },
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error('Product create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
