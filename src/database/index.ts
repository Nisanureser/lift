import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env'
import { schema } from './schema'

// PostgreSQL baglanti havuzunu olusturur ve Drizzle istemcisini dondurur
const queryClient = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
})

export const db = drizzle(queryClient, { schema })

export type Database = typeof db
