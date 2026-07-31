export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

const supportedTypes = new Set(IMAGE_ACCEPT.split(','))

export function validateImageFile(file) {
  if (!file || !supportedTypes.has(file.type) || file.size > IMAGE_MAX_BYTES) {
    return { valid: false, reason: 'invalid' }
  }

  return { valid: true, reason: null }
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB'
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
