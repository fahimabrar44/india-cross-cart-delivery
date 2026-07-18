export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Category from '@/models/Category'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')
    const filter: Record<string, unknown> = {}
    if (brand) filter.brand = brand
    if (session.user.role !== 'super_admin') filter.brand = { $in: session.user.brandAccess }

    const data = await Category.find(filter).sort({ name: 1 })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()

    const body = await request.json()
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const existing = await Category.findOne({ slug, brand: body.brand })
    if (existing) return NextResponse.json({ error: 'Category already exists' }, { status: 400 })

    const category = await Category.create({
      name: body.name,
      slug,
      brand: body.brand,
      description: body.description,
      parent: body.parent || undefined,
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()

    const body = await request.json()
    const category = await Category.findByIdAndUpdate(body.id, {
      name: body.name,
      description: body.description,
      isActive: body.isActive,
    }, { new: true })

    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: category })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await Category.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

