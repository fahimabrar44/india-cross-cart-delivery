import { NextResponse } from 'next/server'
import { auth } from './auth'
import type { Session } from 'next-auth'

export async function getSession(): Promise<Session | null> {
  const result = await auth()
  if (result && 'user' in result) return result as Session
  return null
}

export async function requireAuth(): Promise<Session> {
  const result = await auth()
  if (!result || !('user' in result)) {
    throw new Error('Unauthorized')
  }
  return result as Session
}

export function checkPermission(session: Session | null, permission: string) {
  if (!session?.user) return false
  if (session.user.role === 'super_admin') return true
  return session.user.permissions.includes(permission)
}

export function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleAPIError(error: unknown) {
  console.error('API Error:', error)
  const message = error instanceof Error ? error.message : 'Internal Server Error'
  return apiError(message, 500)
}
