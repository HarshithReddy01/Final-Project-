import type { Clock } from '../../src/shared/Clock.ts'

export class FakeClock implements Clock {
  #currentTime: number

  constructor(start: Date = new Date()) {
    this.#currentTime = start.getTime()
  }

  now(): Date {
    return new Date(this.#currentTime)
  }

  advance(milliseconds: number): void {
    this.#currentTime += milliseconds
  }
}
