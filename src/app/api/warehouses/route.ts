export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Warehouse from '@/models/Warehouse'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')

    const filter: Record<string, unknown> = {}
    if (brand) filter.brand = brand

    if (session.user.role !== 'super_admin') {
      filter.brand = { $in: session.user.brandAccess }
    }

    const data = await Warehouse.find(filter).populate('brand', 'name').sort({ createdAt: -1 })

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

    const warehouse = await Warehouse.create({
      name: body.name,
      brand: body.brand,
      manager: body.manager,
      phone: body.phone,
      email: body.email,
      address: body.address,
      location: body.location,
    })

    return NextResponse.json({ data: warehouse }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

