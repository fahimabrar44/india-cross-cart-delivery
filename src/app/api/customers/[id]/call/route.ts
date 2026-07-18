export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Customer from '@/models/Customer'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const { id } = await params
    const { phone, response, orderId } = await request.json()

    if (!phone || !response) {
      return NextResponse.json({ error: 'Phone and response required' }, { status: 400 })
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      {
        $push: {
          callLogs: {
            phone,
            response,
            orderId: orderId || undefined,
            timestamp: new Date(),
            userId: session.user.id,
          },
        },
      },
      { new: true }
    )

    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Call log error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
