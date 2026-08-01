import { Elysia } from 'elysia'
import { authRoutes } from './auth.routes'
import { categoryRoutes } from './category.routes'
import { customerRoutes } from './customer.routes'
import { productRoutes } from './product.routes'

// Tum route gruplarini tek noktadan export eder
export const apiRoutes = new Elysia()
  .use(authRoutes)
  .use(categoryRoutes)
  .use(customerRoutes)
  .use(productRoutes)
