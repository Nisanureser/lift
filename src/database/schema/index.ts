import { users } from './users'
import { refreshTokens } from './refresh-tokens'
import { tokenBlacklist } from './token-blacklist'

// Tum Drizzle tablolarini tek noktadan export eder (migration ve sorgular icin)
export const schema = {
  users,
  refreshTokens,
  tokenBlacklist,
} as const

export { users, refreshTokens, tokenBlacklist }
