export class TypeGuard {
  static isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  static isStringRecord(value: unknown): value is Readonly<Record<string, string>> {
    return TypeGuard.isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string')
  }
}
