import type { HttpClient } from '../http/HttpClient.ts'
import { Artwork } from './Artwork.ts'
import { Department } from './Department.ts'
import type { MetDepartmentsDto, MetObjectDto, MetSearchDto } from './MetObjectDto.ts'
import type { ResultWindow } from './Pagination.ts'
import type { SearchQuery } from './SearchQuery.ts'
import { SearchPage } from './SearchPage.ts'

export class MetMuseumClient {
  static readonly baseUrl = 'https://collectionapi.metmuseum.org/public/collection'

  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  async search(query: SearchQuery, resultWindow: ResultWindow, signal?: AbortSignal): Promise<SearchPage> {
    const params = query.toApiParams()
    params.set('offset', String(resultWindow.offset))
    params.set('limit', String(resultWindow.limit))
    const dto = await this.#http.get<MetSearchDto>('/v1.1/search', { query: params, signal })
    return SearchPage.fromDto(dto)
  }

  async getArtwork(id: number, signal?: AbortSignal): Promise<Artwork> {
    const dto = await this.#http.get<MetObjectDto>(`/v1/objects/${id}`, { signal })
    return Artwork.fromDto(dto)
  }

  async getDepartments(signal?: AbortSignal): Promise<Department[]> {
    const dto = await this.#http.get<MetDepartmentsDto>('/v1/departments', { signal })
    return dto.departments.map((department) => Department.fromDto(department)).toSorted(Department.compare)
  }
}
