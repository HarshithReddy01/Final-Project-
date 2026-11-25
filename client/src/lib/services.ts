import { HttpClient } from './http/HttpClient.ts'
import { MetMuseumClient } from './met/MetMuseumClient.ts'
import { AuthApi } from './vitrine/AuthApi.ts'
import { FavoritesApi } from './vitrine/FavoritesApi.ts'
import { SessionTokenStore } from './vitrine/SessionTokenStore.ts'

export class Services {
  static readonly apiPath = '/api'

  readonly met: MetMuseumClient
  readonly auth: AuthApi
  readonly favorites: FavoritesApi

  constructor(apiOrigin: string | undefined = import.meta.env.VITE_API_URL, tokens = new SessionTokenStore()) {
    const vitrine = new HttpClient(Services.apiBaseUrl(apiOrigin), { credentials: 'omit', tokens })
    this.met = new MetMuseumClient(new HttpClient(MetMuseumClient.baseUrl, { credentials: 'omit' }))
    this.auth = new AuthApi(vitrine, tokens)
    this.favorites = new FavoritesApi(vitrine)
  }

  static apiBaseUrl(apiOrigin: string | undefined): string {
    const origin = (apiOrigin ?? '').trim().replace(/\/+$/, '')
    return `${origin}${Services.apiPath}`
  }
}

export const services = new Services()
