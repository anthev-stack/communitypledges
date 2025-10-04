import crypto from 'crypto'

/**
 * Generate a secure random token for email verification or password reset
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate a secure random token with expiration
 */
export function generateTokenWithExpiration(expirationHours: number = 24) {
  const token = generateSecureToken()
  const expires = new Date()
  expires.setHours(expires.getHours() + expirationHours)
  
  return {
    token,
    expires
  }
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expires: Date): boolean {
  return new Date() > expires
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}
