import type { MetSearchDto } from './MetObjectDto.ts'

export class SearchPage {
  readonly total: number
  readonly objectIds: readonly number[]

  constructor(total: number, objectIds: readonly number[]) {
    this.total = total
    this.objectIds = objectIds
  }

  static fromDto(dto: MetSearchDto): SearchPage {
    const total = Number.isFinite(dto.total) ? Math.max(0, dto.total) : 0
    return new SearchPage(total, Array.from(new Set(dto.objectIDs ?? [])))
  }

  get isEmpty(): boolean {
    return this.objectIds.length === 0
  }
}
