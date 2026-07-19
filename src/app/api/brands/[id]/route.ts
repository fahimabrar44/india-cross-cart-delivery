export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Brand from '@/models/Brand'
import { createAuditLog } from '@/services/audit.service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { id } = await params
    const brand = await Brand.findById(id).lean()
    if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: brand })
  } catch (error) {
    console.error('Brand fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    if (session.user.role !== 'super_admin' && !session.user.brandAccess.includes(id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()
    const body = await request.json()

    const update: Record<string, unknown> = {}
    if (body.name) update.name = body.name
    if (body.email) update.email = body.email
    if (body.phone) update.phone = body.phone
    if (body.address) update.address = body.address
    if (body.currency) update.currency = body.currency
    if (body.currencySymbol) update.currencySymbol = body.currencySymbol
    if (body.status) update.status = body.status
    if (body.invoiceSettings) update.invoiceSettings = body.invoiceSettings
    if (body.logo) update.logo = body.logo

    const brand = await Brand.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean()
    if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await createAuditLog({
      brand: id,
      user: session.user.id,
      action: 'update_brand',
      entity: 'Brand',
      entityId: id,
      after: { name: brand.name },
    })

    return NextResponse.json({ data: brand })
  } catch (error) {
    console.error('Brand update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await connectDB()

    const brand = await Brand.findByIdAndDelete(id).lean()
    if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await createAuditLog({
      brand: id,
      user: session.user.id,
      action: 'delete_brand',
      entity: 'Brand',
      entityId: id,
      after: { name: brand.name },
    })

    return NextResponse.json({ data: { id }, message: 'Brand deleted successfully' })
  } catch (error) {
    console.error('Brand delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
