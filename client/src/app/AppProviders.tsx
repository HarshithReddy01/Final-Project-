import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientFactory } from './QueryClientFactory.ts'

type AppProvidersProps = {
  readonly children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [client] = useState(() => new QueryClientFactory().create())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
