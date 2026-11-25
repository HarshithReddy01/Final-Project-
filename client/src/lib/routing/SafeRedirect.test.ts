import { describe, expect, it } from 'vitest'
import { SafeRedirect } from './SafeRedirect.ts'

describe('SafeRedirect', () => {
  it('accepts paths inside the app', () => {
    expect(SafeRedirect.resolve('/collection')).toBe('/collection')
    expect(SafeRedirect.resolve('/?q=cat&page=2')).toBe('/?q=cat&page=2')
    expect(SafeRedirect.resolve('/artworks/436535#notes')).toBe('/artworks/436535#notes')
  })

  it('falls back when there is nothing to return to', () => {
    expect(SafeRedirect.resolve(null)).toBe('/')
    expect(SafeRedirect.resolve(undefined)).toBe('/')
    expect(SafeRedirect.resolve('')).toBe('/')
  })

  it('rejects relative paths and other origins', () => {
    expect(SafeRedirect.resolve('collection')).toBe('/')
    expect(SafeRedirect.resolve('https://evil.example')).toBe('/')
    expect(SafeRedirect.resolve('javascript:alert(1)')).toBe('/')
  })

  it('rejects protocol-relative tricks', () => {
    expect(SafeRedirect.resolve('//evil.example')).toBe('/')
    expect(SafeRedirect.resolve('/\\evil.example')).toBe('/')
    expect(SafeRedirect.resolve('/\t/evil.example')).toBe('/')
    expect(SafeRedirect.resolve('/\n/evil.example')).toBe('/')
  })

  it('uses the fallback it is given', () => {
    expect(SafeRedirect.resolve('//evil.example', '/collection')).toBe('/collection')
  })
})
