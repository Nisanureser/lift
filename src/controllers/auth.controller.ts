import type { SafeUser } from '../types/auth.types'
import { loginUser, registerUser } from '../services/auth.service'
import { issueTokenPair, revokeSession, rotateTokenPair } from '../services/token.service'
import { runController } from '../utils/controller.util'

type JwtSigner = {
  sign: (payload: Record<string, string>) => Promise<string>
}

// Token ciftini mobil uyumluluk icin token alias'i ile birlikte dondurur
function toAuthResponse(user: SafeUser, accessToken: string, refreshToken: string) {
  return {
    user,
    accessToken,
    refreshToken,
    token: accessToken,
  }
}

// Yeni kullanici kaydi HTTP handler'i
export async function register({
  body,
  jwt,
  set,
}: {
  body: Parameters<typeof registerUser>[0]
  jwt: JwtSigner
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const user = await registerUser(body)
    const tokens = await issueTokenPair(user, jwt)

    set.status = 201
    return toAuthResponse(user, tokens.accessToken, tokens.refreshToken)
  })
}

// Kullanici girisi HTTP handler'i
export async function login({
  body,
  jwt,
  set,
}: {
  body: Parameters<typeof loginUser>[0]
  jwt: JwtSigner
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const user = await loginUser(body)
    const tokens = await issueTokenPair(user, jwt)

    set.status = 200
    return toAuthResponse(user, tokens.accessToken, tokens.refreshToken)
  })
}

// Refresh token ile yeni access token uretir
export async function refresh({
  body,
  jwt,
  set,
}: {
  body: { refreshToken: string }
  jwt: JwtSigner
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    const tokens = await rotateTokenPair(body.refreshToken, jwt)

    set.status = 200
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      token: tokens.accessToken,
    }
  })
}

// Oturum acik kullanicinin profil bilgisini dondurur
export function me({ user }: { user: SafeUser }) {
  return { user }
}

// Cikis yaparak refresh token'i iptal eder ve access token'i blacklist'e alir
export async function logout({
  body,
  accessJti,
  set,
}: {
  body: { refreshToken: string }
  accessJti?: string
  set: { status?: number | string }
}) {
  return runController(set, async () => {
    await revokeSession(body.refreshToken, accessJti)
    return { message: 'Logged out successfully' }
  })
}
