export type FieldMessages = {
  readonly hint?: string | null
  readonly error?: string | null
}

export class FieldIds {
  readonly control: string
  readonly hint: string
  readonly error: string

  constructor(control: string) {
    this.control = control
    this.hint = `${control}-hint`
    this.error = `${control}-error`
  }

  describedBy(messages: FieldMessages, extra?: string): string | undefined {
    const ids = [extra, messages.error ? this.error : null, messages.hint ? this.hint : null].filter(
      (id): id is string => typeof id === 'string' && id !== '',
    )
    return ids.length === 0 ? undefined : ids.join(' ')
  }
}
