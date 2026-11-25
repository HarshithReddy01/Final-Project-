export class TextFormat {
  static readonly #numbers = new Intl.NumberFormat('en-US')
  static readonly #dates = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  static readonly #trailingHighSurrogate = /[\uD800-\uDBFF]$/

  static number(value: number): string {
    return TextFormat.#numbers.format(value)
  }

  static count(value: number, singular: string, plural: string): string {
    return `${TextFormat.number(value)} ${value === 1 ? singular : plural}`
  }

  static date(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const parts = TextFormat.#dates.formatToParts(date)
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? ''
    return `${part('day')} ${part('month')} ${part('year')}`
  }

  static clip(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value
    return value.slice(0, maxLength).replace(TextFormat.#trailingHighSurrogate, '').trimEnd()
  }
}
