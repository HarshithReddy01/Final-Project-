type LogLevel = 'info' | 'warn' | 'error'

export type LogWriter = Pick<Console, LogLevel>

export class Logger {
  static readonly #discard: LogWriter = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }

  readonly #writer: LogWriter

  constructor(writer: LogWriter = console) {
    this.#writer = writer
  }

  static silent(): Logger {
    return new Logger(Logger.#discard)
  }

  info(message: string, ...details: unknown[]): void {
    this.#writer.info(Logger.#format('info', message), ...details)
  }

  warn(message: string, ...details: unknown[]): void {
    this.#writer.warn(Logger.#format('warn', message), ...details)
  }

  error(message: string, ...details: unknown[]): void {
    this.#writer.error(Logger.#format('error', message), ...details)
  }

  static #format(level: LogLevel, message: string): string {
    return `${new Date().toISOString()} ${level.toUpperCase()} ${message}`
  }
}
