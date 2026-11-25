export type ArtworkLoadState = 'pending' | 'loaded' | 'failed'

export type ArtworkLoad = {
  readonly id: number
  readonly state: ArtworkLoadState
  readonly hasImage: boolean
}

export type ArtworkQueryState = {
  readonly isPending: boolean
  readonly isError: boolean
  readonly data?: { readonly hasImage: boolean } | undefined
}

export class VisibleResults {
  readonly ids: readonly number[]
  readonly pendingCount: number
  readonly hiddenCount: number

  private constructor(ids: readonly number[], pendingCount: number, hiddenCount: number) {
    this.ids = ids
    this.pendingCount = pendingCount
    this.hiddenCount = hiddenCount
  }

  static from(loads: readonly ArtworkLoad[], includeImageless: boolean): VisibleResults {
    const isHidden = (load: ArtworkLoad) => !includeImageless && load.state === 'loaded' && !load.hasImage
    const firstPending = loads.findIndex((load) => load.state === 'pending')
    const settled = firstPending === -1 ? loads : loads.slice(0, firstPending)
    const waiting = firstPending === -1 ? [] : loads.slice(firstPending)
    return new VisibleResults(
      settled.filter((load) => !isHidden(load)).map((load) => load.id),
      waiting.filter((load) => !isHidden(load)).length,
      loads.filter(isHidden).length,
    )
  }

  static describe(id: number, query: ArtworkQueryState | undefined): ArtworkLoad {
    if (query === undefined || query.isPending) return { id, state: 'pending', hasImage: false }
    if (query.isError) return { id, state: 'failed', hasImage: false }
    return { id, state: 'loaded', hasImage: query.data?.hasImage ?? false }
  }

  get isSettled(): boolean {
    return this.pendingCount === 0
  }

  get isEmpty(): boolean {
    return this.isSettled && this.ids.length === 0
  }
}
