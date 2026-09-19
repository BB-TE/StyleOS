import { useContext } from 'react'
import { DataSyncContext } from '../contexts/DataSyncContext.jsx'

export const useDataSync = () => useContext(DataSyncContext)
