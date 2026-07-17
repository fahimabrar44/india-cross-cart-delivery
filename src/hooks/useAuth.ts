'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isSuperAdmin: session?.user?.role === 'super_admin',
    hasPermission: (permission: string) => {
      if (!session?.user) return false
      if (session.user.role === 'super_admin') return true
      return session.user.permissions?.includes(permission) ?? false
    },
    hasBrandAccess: (brandId: string) => {
      if (!session?.user) return false
      if (session.user.role === 'super_admin') return true
      return session.user.brandAccess?.includes(brandId) ?? false
    },
  }
}
