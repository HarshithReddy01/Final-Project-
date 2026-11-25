import { PositiveInteger } from '../PositiveInteger.ts'
import { TextFormat } from '../format/TextFormat.ts'
import type { FavoriteSnapshotDto } from '../vitrine/dto.ts'
import { ArtworkImage } from './ArtworkImage.ts'
import type { MetObjectDto, MetTagDto } from './MetObjectDto.ts'

export type ArtworkFactTone = 'text' | 'mono'

export type ArtworkFact = {
  readonly label: string
  readonly value: string
  readonly tone: ArtworkFactTone
}

export type ArtworkProps = {
  readonly id: number
  readonly title: string
  readonly artist: string
  readonly makerBio: string
  readonly date: string
  readonly medium: string
  readonly dimensions: string
  readonly department: string
  readonly classification: string
  readonly culture: string
  readonly period: string
  readonly dynasty: string
  readonly creditLine: string
  readonly accessionNumber: string
  readonly galleryNumber: string
  readonly isHighlight: boolean
  readonly isPublicDomain: boolean
  readonly subjects: readonly string[]
  readonly sourceUrl: string
  readonly images: readonly ArtworkImage[]
}

export class Artwork {
  static readonly maxId = 2_147_483_647
  static readonly untitled = 'Untitled'
  static readonly unknownMaker = 'Unknown maker'
  static readonly #collectionUrl = 'https://www.metmuseum.org/art/collection/search/'
  static readonly #lineBreaks = /\r\n?/g
  static readonly #snapshotLimits = {
    title: 500,
    artist: 300,
    date: 120,
    medium: 1000,
    department: 120,
    imageUrl: 500,
  } as const

  readonly id: number
  readonly title: string
  readonly maker: string
  readonly makerBio: string
  readonly date: string
  readonly medium: string
  readonly dimensions: string
  readonly department: string
  readonly classification: string
  readonly culture: string
  readonly period: string
  readonly dynasty: string
  readonly creditLine: string
  readonly accessionNumber: string
  readonly galleryNumber: string
  readonly isHighlight: boolean
  readonly isPublicDomain: boolean
  readonly subjects: readonly string[]
  readonly sourceUrl: string
  readonly images: readonly ArtworkImage[]
  readonly #artist: string

  constructor(props: ArtworkProps) {
    this.id = props.id
    this.title = props.title
    this.#artist = props.artist
    this.maker = props.artist || props.culture || Artwork.unknownMaker
    this.makerBio = props.makerBio
    this.date = props.date
    this.medium = props.medium
    this.dimensions = props.dimensions
    this.department = props.department
    this.classification = props.classification
    this.culture = props.culture
    this.period = props.period
    this.dynasty = props.dynasty
    this.creditLine = props.creditLine
    this.accessionNumber = props.accessionNumber
    this.galleryNumber = props.galleryNumber
    this.isHighlight = props.isHighlight
    this.isPublicDomain = props.isPublicDomain
    this.subjects = props.subjects
    this.sourceUrl = props.sourceUrl
    this.images = props.images
  }

  static fromDto(dto: MetObjectDto): Artwork {
    const text = Artwork.#text
    return new Artwork({
      id: dto.objectID,
      title: text(dto.title) || text(dto.objectName) || Artwork.untitled,
      artist: text(dto.artistDisplayName),
      makerBio: text(dto.artistDisplayBio),
      date: text(dto.objectDate),
      medium: text(dto.medium),
      dimensions: text(dto.dimensions),
      department: text(dto.department),
      classification: text(dto.classification),
      culture: text(dto.culture),
      period: text(dto.period),
      dynasty: text(dto.dynasty),
      creditLine: text(dto.creditLine),
      accessionNumber: text(dto.accessionNumber),
      galleryNumber: text(dto.GalleryNumber),
      isHighlight: dto.isHighlight === true,
      isPublicDomain: dto.isPublicDomain === true,
      subjects: Artwork.#subjects(dto.tags),
      sourceUrl: text(dto.objectURL) || `${Artwork.#collectionUrl}${dto.objectID}`,
      images: Artwork.#images(dto),
    })
  }

  static parseId(value: string | null | undefined): number | null {
    return PositiveInteger.parse(value, Artwork.maxId)
  }

  static isValidId(value: number | null | undefined): value is number {
    return typeof value === 'number' && PositiveInteger.isValid(value, Artwork.maxId)
  }

  get hasImage(): boolean {
    return this.images.length > 0
  }

  get primaryImage(): ArtworkImage | null {
    return this.images[0] ?? null
  }

  get isOnView(): boolean {
    return this.galleryNumber !== ''
  }

  get altText(): string {
    if (this.#artist !== '') return `${this.title} by ${this.#artist}`
    if (this.culture !== '') return `${this.title}, ${this.culture}`
    return this.title
  }

  get facts(): readonly ArtworkFact[] {
    const facts: readonly ArtworkFact[] = [
      { label: 'Date', value: this.date, tone: 'text' },
      { label: 'Medium', value: this.medium, tone: 'text' },
      { label: 'Dimensions', value: this.dimensions, tone: 'text' },
      { label: 'Classification', value: this.classification, tone: 'text' },
      { label: 'Culture', value: this.culture, tone: 'text' },
      { label: 'Period', value: this.period, tone: 'text' },
      { label: 'Dynasty', value: this.dynasty, tone: 'text' },
      { label: 'Credit line', value: this.creditLine, tone: 'text' },
      { label: 'Accession number', value: this.accessionNumber, tone: 'mono' },
      { label: 'Gallery', value: this.isOnView ? `Gallery ${this.galleryNumber}` : '', tone: 'mono' },
    ]
    return facts.filter((fact) => fact.value !== '')
  }

  toSnapshot(): FavoriteSnapshotDto {
    const limits = Artwork.#snapshotLimits
    const image = this.primaryImage
    const imageUrl = image?.isMetHosted && image.displayUrl.length <= limits.imageUrl ? image.displayUrl : null
    return {
      title: TextFormat.clip(this.title, limits.title),
      artist: TextFormat.clip(this.maker, limits.artist),
      date: TextFormat.clip(this.date, limits.date),
      medium: TextFormat.clip(this.medium, limits.medium),
      department: TextFormat.clip(this.department, limits.department),
      imageUrl,
    }
  }

  static #text(value: string | null | undefined): string {
    return (value ?? '').replace(Artwork.#lineBreaks, '\n').trim()
  }

  static #subjects(tags: readonly MetTagDto[] | null): string[] {
    const seen = new Set<string>()
    const subjects: string[] = []
    for (const tag of tags ?? []) {
      const term = Artwork.#text(tag.term)
      const key = term.toLowerCase()
      if (term === '' || seen.has(key)) continue
      seen.add(key)
      subjects.push(term)
    }
    return subjects
  }

  static #images(dto: MetObjectDto): ArtworkImage[] {
    const primary = Artwork.#primaryImage(dto)
    const additional = (dto.additionalImages ?? [])
      .map((url) => Artwork.#text(url))
      .filter((url) => url !== '')
      .map((url) => ArtworkImage.fromOriginal(url))
    const unique = new Map<string, ArtworkImage>()
    for (const image of primary === null ? additional : [primary, ...additional]) {
      if (!unique.has(image.fullUrl)) unique.set(image.fullUrl, image)
    }
    return Array.from(unique.values())
  }

  static #primaryImage(dto: MetObjectDto): ArtworkImage | null {
    const full = Artwork.#text(dto.primaryImage)
    const display = Artwork.#text(dto.primaryImageSmall)
    if (full === '') return display === '' ? null : new ArtworkImage(display, display)
    return display === '' ? ArtworkImage.fromOriginal(full) : new ArtworkImage(display, full)
  }
}
