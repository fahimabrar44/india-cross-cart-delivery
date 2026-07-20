export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Order from '@/models/Order'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const { phone, response } = await request.json()

    if (!phone || !response) {
      return NextResponse.json({ error: 'Phone and response required' }, { status: 400 })
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $push: {
          callLogs: {
            phone,
            response,
            timestamp: new Date(),
            userId: session.user.id,
          },
        },
      },
      { new: true }
    )

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order call log error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
