import type { SafeUser } from '../types/auth.types'
import { loginUser, registerUser } from '../services/auth.service'

// Kullanici bilgisinden JWT access token uretir
async function signUserToken(
  jwt: { sign: (payload: Record<string, string>) => Promise<string> },
  user: SafeUser,
): Promise<string> {
  return jwt.sign({
    userId: user.id,
    email: user.email,
    username: user.username,
  })
}

// Yeni kullanici kaydi HTTP handler'i
export async function register({
  body,
  jwt,
  set,
}: {
  body: Parameters<typeof registerUser>[0]
  jwt: { sign: (payload: Record<string, string>) => Promise<string> }
  set: { status?: number | string }
}) {
  const user = await registerUser(body)
  const token = await signUserToken(jwt, user)

  set.status = 201
  return { user, token }
}

// Kullanici girisi HTTP handler'i
export async function login({
  body,
  jwt,
  set,
}: {
  body: Parameters<typeof loginUser>[0]
  jwt: { sign: (payload: Record<string, string>) => Promise<string> }
  set: { status?: number | string }
}) {
  const user = await loginUser(body)
  const token = await signUserToken(jwt, user)

  set.status = 200
  return { user, token }
}

// Oturum acik kullanicinin profil bilgisini dondurur
export function me({ user }: { user: SafeUser }) {
  return { user }
}
