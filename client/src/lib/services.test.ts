import { describe, expect, it } from 'vitest'
import { Services } from './services.ts'

describe('Services.apiBaseUrl', () => {
  it('uses the same-origin API when no origin is configured', () => {
    expect(Services.apiBaseUrl(undefined)).toBe('/api')
    expect(Services.apiBaseUrl('')).toBe('/api')
  })

  it('points at a separately hosted API, ignoring trailing slashes', () => {
    expect(Services.apiBaseUrl('https://vitrine-api.onrender.com')).toBe('https://vitrine-api.onrender.com/api')
    expect(Services.apiBaseUrl(' https://vitrine-api.onrender.com// ')).toBe('https://vitrine-api.onrender.com/api')
  })
})
