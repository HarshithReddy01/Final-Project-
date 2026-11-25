import type { Row, Value } from '@libsql/client'

export class RowReader {
  readonly #row: Row

  constructor(row: Row) {
    this.#row = row
  }

  text(column: string): string {
    const value = this.#value(column)
    if (typeof value !== 'string') throw RowReader.#mismatch(column, 'text')
    return value
  }

  optionalText(column: string): string | null {
    const value = this.#value(column)
    if (value === null) return null
    if (typeof value !== 'string') throw RowReader.#mismatch(column, 'text or null')
    return value
  }

  integer(column: string): number {
    const value = this.#value(column)
    if (typeof value === 'bigint') return Number(value)
    if (typeof value !== 'number' || !Number.isInteger(value)) throw RowReader.#mismatch(column, 'an integer')
    return value
  }

  #value(column: string): Value {
    const value = this.#row[column]
    if (value === undefined) throw new TypeError(`Column "${column}" is missing from the result`)
    return value
  }

  static #mismatch(column: string, expected: string): TypeError {
    return new TypeError(`Column "${column}" is not ${expected}`)
  }
}
