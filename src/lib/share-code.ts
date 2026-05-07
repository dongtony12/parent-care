import { randomBytes } from 'crypto'

export function generateShareCode(): string {
  return randomBytes(12)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
