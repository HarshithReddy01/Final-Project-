import { createServer } from 'node:http'
import type { RequestListener, Server } from 'node:http'
import type { Database } from './database/Database.ts'

export class HttpServer {
  static readonly #shutdownGraceMs = 10_000

  readonly #server: Server
  readonly #database: Database
  #closing: Promise<void> | null = null

  constructor(listener: RequestListener, database: Database) {
    this.#server = createServer(listener)
    this.#database = database
  }

  listen(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.#server.once('error', reject)
      this.#server.listen(port, () => {
        this.#server.off('error', reject)
        resolve(this.#boundPort(port))
      })
    })
  }

  close(): Promise<void> {
    this.#closing ??= this.#shutDown()
    return this.#closing
  }

  async #shutDown(): Promise<void> {
    const forceClose = setTimeout(() => this.#server.closeAllConnections(), HttpServer.#shutdownGraceMs).unref()
    try {
      await new Promise<void>((resolve, reject) => {
        this.#server.close((error) => (error === undefined ? resolve() : reject(error)))
      })
    } finally {
      clearTimeout(forceClose)
      this.#database.close()
    }
  }

  #boundPort(requestedPort: number): number {
    const address = this.#server.address()
    return typeof address === 'object' && address !== null ? address.port : requestedPort
  }
}
