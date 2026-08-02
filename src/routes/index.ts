import { Elysia } from 'elysia'
import { authRoutes } from './auth.routes'
import { categoryRoutes } from './category.routes'
import { customerRoutes } from './customer.routes'
import { productRoutes } from './product.routes'
import { workOrderRoutes } from './work-order.routes'
import { orderRoutes } from './order.routes'
import { reportRoutes } from './report.routes'
import { serviceLogRoutes } from './service-log.routes'

// Tum route gruplarini tek noktadan export eder
export const apiRoutes = new Elysia()
  .use(authRoutes)
  .use(categoryRoutes)
  .use(customerRoutes)
  .use(productRoutes)
  .use(orderRoutes)
  .use(reportRoutes)
  .use(workOrderRoutes)
  .use(serviceLogRoutes)
