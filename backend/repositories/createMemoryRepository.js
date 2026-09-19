import { FileMemoryRepository } from './fileMemoryRepository.js'

export function createMemoryRepository(config) {
  if (config.persistenceMode === 'file') {
    if (!config.allowUnauthenticatedMemorySync) {
      return { enabled: false, persistence: 'disabled', repository: null }
    }
    return {
      enabled: true,
      persistence: 'server_file',
      repository: new FileMemoryRepository(config.storagePath),
    }
  }

  if (config.persistenceMode === 'supabase') {
    throw new Error('PERSISTENCE_MODE=supabase requires the authenticated Supabase repository, which is not implemented yet.')
  }

  throw new Error(`Unsupported PERSISTENCE_MODE: ${config.persistenceMode}`)
}
