export class PositiveInteger {
  static readonly #pattern = /^[1-9]\d*$/

  static parse(value: string | null | undefined, max = Number.MAX_SAFE_INTEGER): number | null {
    if (value === null || value === undefined || !PositiveInteger.#pattern.test(value)) return null
    const parsed = Number(value)
    return PositiveInteger.isValid(parsed, max) ? parsed : null
  }

  static isValid(value: number, max = Number.MAX_SAFE_INTEGER): boolean {
    return Number.isSafeInteger(value) && value > 0 && value <= max
  }
}
