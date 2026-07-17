import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Supplier from '@/models/Supplier'
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (brand) filter.brand = brand
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    if (session.user.role !== 'super_admin') {
      filter.brand = { $in: session.user.brandAccess }
    }

    const [data, total] = await Promise.all([
      Supplier.find(filter)
        .populate('brand', 'name')
        .populate('products', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Supplier.countDocuments(filter),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()

    const supplier = await Supplier.create({
      name: body.name,
      phone: body.phone,
      company: body.company,
      email: body.email,
      address: body.address,
      brand: body.brand,
      products: body.products || [],
      isActive: true,
    })

    await createAuditLog({
      user: session.user.id,
      action: 'create_supplier',
      entity: 'Supplier',
      entityId: supplier._id.toString(),
      after: { name: supplier.name, phone: supplier.phone },
    })

    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error) {
    console.error('Supplier create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
