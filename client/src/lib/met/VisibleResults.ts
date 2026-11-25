import { ApiError } from '../http/ApiError.ts'

export type ArtworkLoadState = 'pending' | 'retrying' | 'loaded' | 'failed' | 'missing'

export type ArtworkLoad = {
  readonly id: number
  readonly state: ArtworkLoadState
  readonly hasImage: boolean
}

export type ArtworkQueryState = {
  readonly isPending: boolean
  readonly isFetched: boolean
  readonly failureCount: number
  readonly error: Error | null
  readonly data?: { readonly hasImage: boolean } | undefined
}

type VisibleResultsValues = {
  readonly ids: readonly number[]
  readonly pendingCount: number
  readonly hiddenCount: number
  readonly imagelessCount: number
  readonly isRetrying: boolean
}

export class VisibleResults {
  readonly ids: readonly number[]
  readonly pendingCount: number
  readonly hiddenCount: number
  readonly imagelessCount: number
  readonly #isRetrying: boolean

  private constructor(values: VisibleResultsValues) {
    this.ids = values.ids
    this.pendingCount = values.pendingCount
    this.hiddenCount = values.hiddenCount
    this.imagelessCount = values.imagelessCount
    this.#isRetrying = values.isRetrying
  }

  static from(loads: readonly ArtworkLoad[], includeImageless: boolean): VisibleResults {
    const present = loads.filter((load) => load.state !== 'missing')
    const isImageless = (load: ArtworkLoad) => load.state === 'loaded' && !load.hasImage
    const isHidden = (load: ArtworkLoad) => !includeImageless && isImageless(load)
    const firstPending = present.findIndex((load) => load.state === 'pending')
    const revealed = firstPending === -1 ? present : present.slice(0, firstPending)
    const waiting = firstPending === -1 ? [] : present.slice(firstPending)
    return new VisibleResults({
      ids: revealed.filter((load) => !isHidden(load)).map((load) => load.id),
      pendingCount: waiting.filter((load) => !isHidden(load)).length,
      hiddenCount: present.filter(isHidden).length,
      imagelessCount: present.filter(isImageless).length,
      isRetrying: present.some((load) => load.state === 'retrying'),
    })
  }

  static describe(id: number, query: ArtworkQueryState | undefined): ArtworkLoad {
    if (query === undefined) return { id, state: 'pending', hasImage: false }
    if (query.data !== undefined) return { id, state: 'loaded', hasImage: query.data.hasImage }
    if (query.error instanceof ApiError && query.error.isNotFound) return { id, state: 'missing', hasImage: false }
    if (query.isPending && !query.isFetched) {
      return { id, state: query.failureCount > 0 ? 'retrying' : 'pending', hasImage: false }
    }
    return { id, state: 'failed', hasImage: false }
  }

  get isSettled(): boolean {
    return this.pendingCount === 0 && !this.#isRetrying
  }

  get isEmpty(): boolean {
    return this.isSettled && this.ids.length === 0
  }
}
