import type { LoginBody, RegisterBody, UserResponse } from '../dtos/auth.dto'

export type RegisterInput = typeof RegisterBody.static
export type LoginInput = typeof LoginBody.static
export type SafeUser = typeof UserResponse.static
