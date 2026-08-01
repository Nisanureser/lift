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
}
