import { describe, expect, it } from 'vitest'
import { AuthPaths } from './AuthPaths.ts'

describe('AuthPaths', () => {
  it('adds the return path to the sign-in and register links', () => {
    expect(AuthPaths.signIn('/collection')).toBe('/sign-in?next=%2Fcollection')
    expect(AuthPaths.register('/?q=cat&page=2')).toBe('/register?next=%2F%3Fq%3Dcat%26page%3D2')
  })

  it('leaves the default return path out', () => {
    expect(AuthPaths.signIn()).toBe('/sign-in')
    expect(AuthPaths.register('/')).toBe('/register')
  })

  it('never carries an unsafe return path', () => {
    expect(AuthPaths.signIn('//evil.example')).toBe('/sign-in')
  })

  it('reads the return path from the query', () => {
    expect(AuthPaths.nextFrom(new URLSearchParams('next=%2Fcollection'))).toBe('/collection')
    expect(AuthPaths.nextFrom(new URLSearchParams('next=https%3A%2F%2Fevil.example'))).toBe('/')
    expect(AuthPaths.nextFrom(new URLSearchParams())).toBe('/')
  })

  it('returns to the current page, or keeps the pending return path on auth pages', () => {
    expect(AuthPaths.returnTo({ pathname: '/artworks/436535', search: '' })).toBe('/artworks/436535')
    expect(AuthPaths.returnTo({ pathname: '/', search: '?q=cat' })).toBe('/?q=cat')
    expect(AuthPaths.returnTo({ pathname: '/register', search: '?next=%2Fcollection' })).toBe('/collection')
    expect(AuthPaths.returnTo({ pathname: '/sign-in', search: '' })).toBe('/')
  })
})
