import { users } from './users'
import { refreshTokens } from './refresh-tokens'
import { tokenBlacklist } from './token-blacklist'
import { categories } from './categories'
import { products } from './products'
import { productImages } from './product-images'
import { stockMovements } from './stock-movements'
import { customers } from './customers'
import { sites } from './sites'
import { elevators } from './elevators'
import { contracts } from './contracts'
import { workOrders } from './work-orders'
import { serviceLogs } from './service-logs'
import { serviceLogPhotos } from './service-log-photos'
import { serviceParts } from './service-parts'
import { serviceExpenses } from './service-expenses'
import { orders } from './orders'
import { orderItems } from './order-items'
import { orderMovements } from './order-movements'
import { orderPayments } from './order-payments'

// Tum Drizzle tablolarini tek noktadan export eder (migration ve sorgular icin)
export const schema = {
  users,
  refreshTokens,
  tokenBlacklist,
  categories,
  products,
  productImages,
  stockMovements,
  customers,
  sites,
  elevators,
  contracts,
  workOrders,
  serviceLogs,
  serviceLogPhotos,
  serviceParts,
  serviceExpenses,
  orders,
  orderItems,
  orderMovements,
  orderPayments,
} as const

export {
  users,
  refreshTokens,
  tokenBlacklist,
  categories,
  products,
  productImages,
  stockMovements,
  customers,
  sites,
  elevators,
  contracts,
  workOrders,
  serviceLogs,
  serviceLogPhotos,
  serviceParts,
  serviceExpenses,
  orders,
  orderItems,
  orderMovements,
  orderPayments,
}
