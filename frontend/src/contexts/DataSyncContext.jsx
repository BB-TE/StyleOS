import { createContext } from 'react'

export const DataSyncContext = createContext({ status: 'local', persistence: 'local_only', lastSyncedAt: null, retry: () => {} })
