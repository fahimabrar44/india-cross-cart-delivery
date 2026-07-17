export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Brand from '@/models/Brand'
import { createAuditLog } from '@/services/audit.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    let brands
    if (session.user.role === 'super_admin') {
      brands = await Brand.find().sort({ name: 1 })
    } else {
      brands = await Brand.find({ _id: { $in: session.user.brandAccess } }).sort({ name: 1 })
    }

    return NextResponse.json({ data: brands })
  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()
    const body = await request.json()

    const brand = await Brand.create({
      name: body.name,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo: body.logo,
      email: body.email,
      phone: body.phone,
      address: body.address,
      currency: body.currency || 'BDT',
      currencySymbol: body.currencySymbol || '৳',
      invoiceSettings: {
        prefix: body.invoicePrefix || 'INV',
        nextNumber: 1000,
      },
      status: body.status || 'active',
    })

    await createAuditLog({
      user: session.user.id,
      action: 'create_brand',
      entity: 'Brand',
      entityId: brand._id.toString(),
      after: { name: brand.name },
    })

    return NextResponse.json({ data: brand }, { status: 201 })
  } catch (error) {
    console.error('Brand create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

