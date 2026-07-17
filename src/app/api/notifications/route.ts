import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Notification from '@/models/Notification'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')

    const filter: Record<string, unknown> = {}
    if (brand) {
      filter.brand = brand
    } else if (session.user.role !== 'super_admin') {
      filter.brand = { $in: session.user.brandAccess }
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({ data: notifications })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()

    const notification = await Notification.create({
      brand: body.brand,
      type: body.type,
      title: body.title,
      message: body.message,
      link: body.link,
    })

    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (error) {
    console.error('Notification create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()

    if (!body.id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })

    const notification = await Notification.findByIdAndUpdate(body.id, { isRead: true }, { new: true })
    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: notification })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const body = await request.json()

    if (!body.brand) return NextResponse.json({ error: 'Brand required' }, { status: 400 })

    await Notification.updateMany({ brand: body.brand, isRead: false }, { isRead: true })

    return NextResponse.json({ data: { message: 'All notifications marked as read' } })
  } catch (error) {
    console.error('Notifications mark all read error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
