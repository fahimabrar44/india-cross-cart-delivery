import mongoose from 'mongoose'

const HARDCODED_URI = 'mongodb+srv://mdforhadul44_db_user:voHm0Aikz6z5tBUj@cluster0.qktrz9s.mongodb.net/?appName=Cluster0'

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
  const MONGODB_URI = process.env.MONGODB_URI || HARDCODED_URI

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null
    throw new Error(
      'Failed to connect to MongoDB. Please check your database connection string is correct.'
    )
  }
}
