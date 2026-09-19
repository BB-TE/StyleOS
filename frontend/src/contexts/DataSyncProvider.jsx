import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getProductState, markProductStateSynced, replaceProductState } from '../domain/productStore.js'
import {
  fetchMemoryState,
  MEMORY_SYNC_CONSENT_EVENT,
  memorySyncEnabled,
  saveMemoryState,
} from '../utils/memorySyncClient.js'
import { DataSyncContext } from './DataSyncContext.jsx'

const timestamp = (value) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0
const hasMeaningfulState = (state) => Boolean(state?.memory?.records?.length || state?.wardrobe?.length || state?.decisions?.length)
const hasUserCreatedState = (state) => Boolean(
  state?.wardrobe?.length
  || state?.decisions?.length
  || state?.memory?.profile?.setupCompleted
  || state?.memory?.records?.some((record) => record.kind !== 'monthlyBudget'),
)
const responseRevision = (payload) => Number(payload?.revision ?? payload?.state?.revision ?? 0)

export function DataSyncProvider({ children }) {
  const [status, setStatus] = useState(memorySyncEnabled() ? 'connecting' : 'local')
  const [persistence, setPersistence] = useState('local_only')
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const hydrating = useRef(false)
  const timer = useRef(null)
  const mounted = useRef(true)
  const activeSync = useRef(null)
  const rerunRequested = useRef(false)
  const remoteRevision = useRef(null)
  const activeRequest = useRef(null)

  const showLocal = useCallback(() => {
    if (!mounted.current) return
    setStatus('local')
    setPersistence('local_only')
  }, [])

  const synchronize = useCallback(async ({ initial = false } = {}) => {
    if (!memorySyncEnabled()) {
      showLocal()
      return
    }

    if (activeSync.current) {
      rerunRequested.current = true
      await activeSync.current
      if (rerunRequested.current && memorySyncEnabled()) return synchronize({ initial: true })
      return
    }

    const task = (async () => {
      let needsInitialRead = initial || remoteRevision.current === null
      do {
        rerunRequested.current = false
        if (!memorySyncEnabled()) return showLocal()
        if (mounted.current) setStatus(needsInitialRead ? 'connecting' : 'syncing')

        let localState = getProductState()
        if (needsInitialRead) {
          activeRequest.current = new AbortController()
          const remote = await fetchMemoryState({ signal: activeRequest.current.signal })
          remoteRevision.current = responseRevision(remote)
          if (mounted.current) setPersistence(remote.persistence || 'server_file')

          const latestLocal = getProductState()
          const changedDuringRead = latestLocal.meta.revision !== localState.meta.revision
          const locallyDirty = latestLocal.meta.lastSyncedAt && latestLocal.meta.syncedRevision !== latestLocal.meta.revision
          const unmergedLocalData = !latestLocal.meta.lastSyncedAt && hasUserCreatedState(latestLocal)
          if (hasMeaningfulState(remote.state) && timestamp(remote.state.updatedAt) > timestamp(latestLocal.updatedAt)) {
            if (changedDuringRead || locallyDirty || unmergedLocalData) {
              rerunRequested.current = false
              if (mounted.current) setStatus('conflict')
              return
            }
            hydrating.current = true
            const hydrated = replaceProductState(remote.state)
            hydrating.current = false
            const syncedAt = remote.state?.updatedAt || new Date().toISOString()
            markProductStateSynced(remoteRevision.current, hydrated?.meta?.revision, syncedAt)
            if (mounted.current) {
              setStatus('synced')
              setLastSyncedAt(syncedAt)
            }
            return
          }
          if (hasMeaningfulState(remote.state) && timestamp(remote.state.updatedAt) === timestamp(latestLocal.updatedAt) && !changedDuringRead && !locallyDirty) {
            markProductStateSynced(remoteRevision.current, latestLocal.meta.revision, remote.state.updatedAt)
            if (mounted.current) {
              setStatus('synced')
              setLastSyncedAt(remote.state.updatedAt)
            }
            return
          }
          localState = latestLocal
        }

        const sentLocalRevision = localState.meta.revision
        activeRequest.current = new AbortController()
        const saved = await saveMemoryState(localState, remoteRevision.current ?? 0, { signal: activeRequest.current.signal })
        remoteRevision.current = responseRevision(saved)
        const syncedAt = saved.state?.updatedAt || new Date().toISOString()
        markProductStateSynced(remoteRevision.current, sentLocalRevision, syncedAt)
        if (mounted.current) {
          setPersistence(saved.persistence || 'server_file')
          setLastSyncedAt(syncedAt)
        }

        const latestLocal = getProductState()
        rerunRequested.current = rerunRequested.current || latestLocal.meta.revision !== sentLocalRevision
        needsInitialRead = false
        if (!rerunRequested.current && mounted.current) setStatus('synced')
      } while (rerunRequested.current && memorySyncEnabled())
    })()
      .catch((error) => {
        hydrating.current = false
        if (error?.name === 'AbortError') {
          if (!memorySyncEnabled()) showLocal()
          return
        }
        rerunRequested.current = false
        if (!memorySyncEnabled()) return showLocal()
        if (mounted.current && error?.status === 409) setStatus('conflict')
        else showLocal()
      })
      .finally(() => {
        activeRequest.current = null
        activeSync.current = null
      })

    activeSync.current = task
    await task
  }, [showLocal])

  useEffect(() => {
    mounted.current = true
    synchronize({ initial: true })

    const onChange = () => {
      if (hydrating.current || !memorySyncEnabled()) return
      if (mounted.current) setStatus('pending')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => synchronize(), 450)
    }
    const onConsentChange = () => {
      clearTimeout(timer.current)
      activeRequest.current?.abort()
      remoteRevision.current = null
      if (memorySyncEnabled()) synchronize({ initial: true })
      else showLocal()
    }

    window.addEventListener('styleos:v2-change', onChange)
    window.addEventListener(MEMORY_SYNC_CONSENT_EVENT, onConsentChange)
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
      activeRequest.current?.abort()
      window.removeEventListener('styleos:v2-change', onChange)
      window.removeEventListener(MEMORY_SYNC_CONSENT_EVENT, onConsentChange)
    }
  }, [showLocal, synchronize])

  const value = useMemo(() => ({ status, persistence, lastSyncedAt, retry: () => synchronize({ initial: true }) }), [status, persistence, lastSyncedAt, synchronize])
  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>
}
