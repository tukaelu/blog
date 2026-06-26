import type { H3Event } from 'h3'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export type AppDatabase = DrizzleD1Database<typeof schema>

export function useDrizzle(event: H3Event): AppDatabase {
  const env = event.context.cloudflare?.env as unknown as Env | undefined
  const db = env?.DB
  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 binding "DB" is not available',
    })
  }
  return drizzle(db, { schema })
}
