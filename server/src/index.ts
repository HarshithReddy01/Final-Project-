import { App } from './App.ts'
import { HttpServer } from './HttpServer.ts'
import { AppConfig } from './config/AppConfig.ts'
import { Database } from './database/Database.ts'
import { migrations } from './database/migrations.ts'
import { SystemClock } from './shared/Clock.ts'
import { Logger } from './shared/Logger.ts'

const logger = new Logger()

const start = async (): Promise<HttpServer> => {
  const config = AppConfig.fromEnvironment()
  const database = new Database(config.database)
  try {
    await database.migrate(migrations)
  } catch (error) {
    database.close()
    throw error
  }
  const app = new App({ config, database, clock: new SystemClock(), logger })
  const server = new HttpServer(app.express, database)
  const port = await server.listen(config.port)
  logger.info(`Vitrine API listening on port ${port}`)
  return server
}

try {
  const server = await start()
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      logger.info(`Received ${signal}, shutting down`)
      server.close().catch((error: unknown) => {
        logger.error('Shutdown failed', error)
        process.exitCode = 1
      })
    })
  }
} catch (error) {
  logger.error('Vitrine API failed to start', error)
  process.exitCode = 1
}
