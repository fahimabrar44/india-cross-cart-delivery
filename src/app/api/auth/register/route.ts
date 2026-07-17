export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { connectDB } from '@/config/db'
import User from '@/models/User'
import Brand from '@/models/Brand'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const brands = await Brand.find({}).limit(1)

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'viewer',
      brandAccess: brands.map((b) => b._id),
      permissions: [],
      isActive: true,
    })

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
