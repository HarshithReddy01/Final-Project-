import type { z } from 'zod'
import { HttpError, type FieldErrors } from './HttpError.ts'

export class RequestValidator {
  static readonly #rootField = '_'

  static parse<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
    const result = schema.safeParse(input)
    if (result.success) return result.data
    throw HttpError.validationFailed(RequestValidator.#fieldErrors(result.error))
  }

  static #fieldErrors(error: z.ZodError): FieldErrors {
    const fields: Record<string, string> = {}
    for (const issue of error.issues) {
      const field = issue.path.length === 0 ? RequestValidator.#rootField : issue.path.map(String).join('.')
      fields[field] ??= issue.message
    }
    return fields
  }
}
