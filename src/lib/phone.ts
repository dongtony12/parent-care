export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null
  return digits
}

export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return input
}
