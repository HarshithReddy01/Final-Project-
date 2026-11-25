import { describe, expect, it } from 'vitest'
import { ArtworkImage } from './ArtworkImage.ts'

describe('ArtworkImage', () => {
  it('derives the web-large rendition from an original', () => {
    const image = ArtworkImage.fromOriginal('https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg')

    expect(image.displayUrl).toBe('https://images.metmuseum.org/CRDImages/ep/web-large/DT1567.jpg')
    expect(image.fullUrl).toBe('https://images.metmuseum.org/CRDImages/ep/original/DT1567.jpg')
  })

  it('keeps a url that has no original segment', () => {
    const image = ArtworkImage.fromOriginal('https://images.metmuseum.org/CRDImages/ep/web-large/DT1567.jpg')

    expect(image.displayUrl).toBe(image.fullUrl)
  })

  it('recognises images hosted by The Met over https only', () => {
    const hosted = (url: string) => new ArtworkImage(url, url).isMetHosted

    expect(hosted('https://images.metmuseum.org/CRDImages/ep/web-large/a.jpg')).toBe(true)
    expect(hosted('http://images.metmuseum.org/CRDImages/ep/web-large/a.jpg')).toBe(false)
    expect(hosted('https://images.metmuseum.org.example.com/a.jpg')).toBe(false)
    expect(hosted('https://example.com/images.metmuseum.org/a.jpg')).toBe(false)
    expect(hosted('not a url')).toBe(false)
  })
})
