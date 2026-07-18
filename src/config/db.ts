import mongoose from 'mongoose'

interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: CachedConnection | undefined
}

const cached: CachedConnection = global.mongooseCache ?? { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!'') {
    throw new Error(
      'MONGODB_URI is not configured. Please add it to your Vercel environment variables:\n' +
      '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables\n' +
      '2. Add MONGODB_URI with your MongoDB Atlas connection string\n' +
      '3. Redeploy the project'
    )  bbhn
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect('mongodb+srv://mdforhadul44_db_user:voHm0Aikz6z5tBUj@cluster0.qktrz9s.mongodb.net/?appName=Cluster0', {
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null
    throw new Error(
      'Failed to connect to MongoDB. Please check your MONGODB_URI is correct.'
    )
  }
}
