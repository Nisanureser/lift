import { Elysia } from 'elysia'
import { authRoutes } from './auth.routes'

// Tum route gruplarini tek noktadan export eder
export const apiRoutes = new Elysia().use(authRoutes)
