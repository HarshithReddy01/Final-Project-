export type PeriodKey = 'before-500' | '500-1400' | '1400-1600' | '1600-1800' | '1800-1900' | '1900-present'

export class Period {
  static readonly all: readonly Period[] = [
    new Period('before-500', 'Before 500', -10_000, 499),
    new Period('500-1400', '500–1400', 500, 1399),
    new Period('1400-1600', '1400–1600', 1400, 1599),
    new Period('1600-1800', '1600–1800', 1600, 1799),
    new Period('1800-1900', '1800–1900', 1800, 1899),
    new Period('1900-present', '1900–present', 1900, new Date().getFullYear()),
  ]

  readonly key: PeriodKey
  readonly label: string
  readonly begin: number
  readonly end: number

  constructor(key: PeriodKey, label: string, begin: number, end: number) {
    this.key = key
    this.label = label
    this.begin = begin
    this.end = end
  }

  static find(key: string | null | undefined): Period | null {
    return Period.all.find((period) => period.key === key) ?? null
  }
}
