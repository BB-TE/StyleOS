import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createEmptyState, normalizeMemoryState } from './memoryState.js'
import { NO_STATE_CHANGE, RevisionConflictError } from './memoryRepository.js'

const EMPTY_STORE = Object.freeze({ version: 1, users: {} })

export class FileMemoryRepository {
  constructor(filePath) {
    this.filePath = filePath
    this.writeQueue = Promise.resolve()
  }

  async readStore() {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8'))
      return parsed && typeof parsed === 'object' && parsed.users && typeof parsed.users === 'object' ? parsed : structuredClone(EMPTY_STORE)
    } catch (error) {
      if (error?.code === 'ENOENT') return structuredClone(EMPTY_STORE)
      throw error
    }
  }

  async writeStore(store) {
    await mkdir(dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), 'utf8')
    await rename(temporaryPath, this.filePath)
  }

  async getState(ownerId) {
    await this.writeQueue
    const store = await this.readStore()
    return normalizeMemoryState(store.users[ownerId] || createEmptyState())
  }

  enqueueWrite(task) {
    const operation = this.writeQueue.then(task, task)
    this.writeQueue = operation.catch(() => undefined)
    return operation
  }

  async replaceState(ownerId, nextState, expectedRevision) {
    const task = async () => {
      const store = await this.readStore()
      const current = normalizeMemoryState(store.users[ownerId] || createEmptyState())
      if (current.revision !== expectedRevision) {
        throw new RevisionConflictError(expectedRevision, current.revision)
      }
      const state = normalizeMemoryState({
        ...nextState,
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      })
      store.users[ownerId] = state
      await this.writeStore(store)
      return state
    }
    return this.enqueueWrite(task)
  }

  async mutateState(ownerId, mutate) {
    const task = async () => {
      const store = await this.readStore()
      const current = normalizeMemoryState(store.users[ownerId] || createEmptyState())
      const mutated = mutate(structuredClone(current))
      if (mutated === NO_STATE_CHANGE) return current
      const next = normalizeMemoryState({
        ...mutated,
        revision: current.revision + 1,
        updatedAt: new Date().toISOString(),
      })
      store.users[ownerId] = next
      await this.writeStore(store)
      return next
    }
    return this.enqueueWrite(task)
  }

  async deleteState(ownerId) {
    const task = async () => {
      const store = await this.readStore()
      const deleted = Object.hasOwn(store.users, ownerId)
      if (deleted) {
        delete store.users[ownerId]
        await this.writeStore(store)
      }
      return deleted
    }
    return this.enqueueWrite(task)
  }
}
