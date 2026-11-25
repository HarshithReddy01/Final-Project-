import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { QueryKeys } from '../hooks/QueryKeys.ts'
import styles from './ServerWakeNotice.module.css'

const patienceMs = 3500

export function ServerWakeNotice() {
  const fetching = useIsFetching({ predicate: (query) => QueryKeys.isVitrine(query.queryKey) })
  const mutating = useIsMutating()
  const isWaiting = fetching + mutating > 0
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    if (!isWaiting) return
    const timer = window.setTimeout(() => setIsSlow(true), patienceMs)
    return () => {
      window.clearTimeout(timer)
      setIsSlow(false)
    }
  }, [isWaiting])

  return (
    <output className={styles.region}>
      {isSlow && (
        <span className={styles.notice}>
          Waking the server. On the free plan it sleeps when nobody is using it, so this first request can take up
          to a minute.
        </span>
      )}
    </output>
  )
}
