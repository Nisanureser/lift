import { users } from './users'

// Tum Drizzle tablolarini tek noktadan export eder (migration ve sorgular icin)
export const schema = {
  users,
} as const

export { users }
