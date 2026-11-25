import { App } from './App.ts'
import { HttpServer } from './HttpServer.ts'
import { AppConfig } from './config/AppConfig.ts'
import { Database } from './database/Database.ts'
import { migrations } from './database/migrations.ts'
import { SystemClock } from './shared/Clock.ts'
import { Logger } from './shared/Logger.ts'

const logger = new Logger()
const config = AppConfig.fromEnvironment()
const database = new Database(config.databasePath)
database.migrate(migrations)

const app = new App({ config, database, clock: new SystemClock(), logger })
const server = new HttpServer(app.express, database)
const port = await server.listen(config.port)
logger.info(`Vitrine API listening on http://localhost:${port}`)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    logger.info(`Received ${signal}, shutting down`)
    server.close().catch((error: unknown) => {
      logger.error('Shutdown failed', error)
      process.exitCode = 1
    })
  })
}
