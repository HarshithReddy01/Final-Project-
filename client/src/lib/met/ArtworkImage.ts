export class ArtworkImage {
  static readonly host = 'images.metmuseum.org'
  static readonly #originalSegment = '/original/'
  static readonly #displaySegment = '/web-large/'

  readonly displayUrl: string
  readonly fullUrl: string

  constructor(displayUrl: string, fullUrl: string) {
    this.displayUrl = displayUrl
    this.fullUrl = fullUrl
  }

  static fromOriginal(url: string): ArtworkImage {
    return new ArtworkImage(url.replace(ArtworkImage.#originalSegment, ArtworkImage.#displaySegment), url)
  }

  get isMetHosted(): boolean {
    try {
      const url = new URL(this.displayUrl)
      return url.protocol === 'https:' && url.hostname === ArtworkImage.host
    } catch {
      return false
    }
  }
}
