import express from 'express'
import type { RequestHandler, Router } from 'express'
import { RequestContext } from '../http/RequestContext.ts'
import { RequestValidator } from '../http/RequestValidator.ts'
import type { FavoriteService } from './FavoriteService.ts'
import { favoriteNoteSchema, favoriteParamsSchema, favoriteSnapshotSchema } from './favoriteSchemas.ts'

export class FavoriteController {
  readonly router: Router
  readonly #favorites: FavoriteService

  constructor(favorites: FavoriteService) {
    this.#favorites = favorites
    this.router = express.Router()
    this.router.get('/', this.#list)
    this.router.route('/:objectId').put(this.#save).patch(this.#updateNote).delete(this.#remove)
  }

  readonly #list: RequestHandler = async (_request, response) => {
    const user = RequestContext.requireUser(response)
    response.json({ favorites: await this.#favorites.list(user.id) })
  }

  readonly #save: RequestHandler = async (request, response) => {
    const user = RequestContext.requireUser(response)
    const { objectId } = RequestValidator.parse(favoriteParamsSchema, request.params)
    const snapshot = RequestValidator.parse(favoriteSnapshotSchema, request.body)
    const { favorite, created } = await this.#favorites.save(user.id, objectId, snapshot)
    response.status(created ? 201 : 200).json({ favorite })
  }

  readonly #updateNote: RequestHandler = async (request, response) => {
    const user = RequestContext.requireUser(response)
    const { objectId } = RequestValidator.parse(favoriteParamsSchema, request.params)
    const { note } = RequestValidator.parse(favoriteNoteSchema, request.body)
    response.json({ favorite: await this.#favorites.updateNote(user.id, objectId, note) })
  }

  readonly #remove: RequestHandler = async (request, response) => {
    const user = RequestContext.requireUser(response)
    const { objectId } = RequestValidator.parse(favoriteParamsSchema, request.params)
    await this.#favorites.remove(user.id, objectId)
    response.status(204).end()
  }
}
