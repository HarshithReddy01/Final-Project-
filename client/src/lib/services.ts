import { HttpClient } from './http/HttpClient.ts'
import { MetMuseumClient } from './met/MetMuseumClient.ts'
import { AuthApi } from './vitrine/AuthApi.ts'
import { FavoritesApi } from './vitrine/FavoritesApi.ts'

export class Services {
  static readonly apiBaseUrl = '/api'

  readonly met: MetMuseumClient
  readonly auth: AuthApi
  readonly favorites: FavoritesApi

  constructor() {
    const vitrine = new HttpClient(Services.apiBaseUrl, { credentials: 'same-origin' })
    this.met = new MetMuseumClient(new HttpClient(MetMuseumClient.baseUrl, { credentials: 'omit' }))
    this.auth = new AuthApi(vitrine)
    this.favorites = new FavoritesApi(vitrine)
  }
}

export const services = new Services()
