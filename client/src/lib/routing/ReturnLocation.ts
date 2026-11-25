import { TypeGuard } from '../TypeGuard.ts'

export type ReturnState = {
  readonly from: string
  readonly label: string
}

export class ReturnLocation {
  readonly from: string
  readonly label: string

  constructor(from: string, label: string) {
    this.from = from
    this.label = label
  }

  static fromState(state: unknown): ReturnLocation | null {
    if (!TypeGuard.isRecord(state)) return null
    const { from, label } = state
    if (typeof from !== 'string' || !from.startsWith('/')) return null
    if (typeof label !== 'string' || label.trim() === '') return null
    return new ReturnLocation(from, label.trim())
  }

  toState(): ReturnState {
    return { from: this.from, label: this.label }
  }
}
