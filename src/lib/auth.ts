import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { connectDB } from '@/config/db'
import User from '@/models/User'
import { ROLE_PERMISSIONS } from '@/config/constants'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
      avatar?: string
      brandAccess: string[]
      permissions: string[]
    }
  }
  interface User {
    role: string
    avatar?: string
    brandAccess: string[]
    permissions: string[]
  }
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email as string }).select('+password').populate('brandAccess')
        if (!user) {
          throw new Error('Invalid email or password')
        }
        if (!user.isActive) {
          throw new Error('Account is deactivated')
        }

        const isValid = await user.comparePassword(credentials.password as string)
        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        const permissions = ROLE_PERMISSIONS[user.role] || []
        const brandIds = user.brandAccess.map((b: { _id: { toString: () => string } }) => b._id.toString())

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          brandAccess: brandIds,
          permissions,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.avatar = user.avatar
        token.brandAccess = user.brandAccess as string[]
        token.permissions = user.permissions as string[]
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string | undefined
        session.user.brandAccess = token.brandAccess as string[]
        session.user.permissions = token.permissions as string[]
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})

export const { GET, POST } = handlers
