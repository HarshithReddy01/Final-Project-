import { describe, expect, it } from 'vitest'
import { ApiError } from './ApiError.ts'

describe('ApiError', () => {
  it('reads Vitrine error bodies with field messages', () => {
    const error = ApiError.fromResponse(409, {
      error: { code: 'username_taken', message: 'Some fields need attention.', fields: { username: 'That username is taken.' } },
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.status).toBe(409)
    expect(error.code).toBe('username_taken')
    expect(error.message).toBe('Some fields need attention.')
    expect(error.fieldError('username')).toBe('That username is taken.')
    expect(error.fieldError('password')).toBeNull()
  })

  it('ignores field maps that are not all strings', () => {
    const error = ApiError.fromResponse(400, {
      error: { code: 'validation_failed', message: 'Some fields need attention.', fields: { username: 3 } },
    })

    expect(error.fields).toEqual({})
  })

  it('reads the message The Met sends', () => {
    const error = ApiError.fromResponse(404, { message: 'ObjectID not found' })

    expect(error.isNotFound).toBe(true)
    expect(error.code).toBe('not_found')
    expect(error.message).toBe('ObjectID not found')
  })

  it('falls back for bodies it does not understand', () => {
    for (const body of [undefined, null, 'Bad Gateway', [], {}, { error: 'nope' }, { message: '  ' }]) {
      const error = ApiError.fromResponse(502, body)

      expect(error.code).toBe('http_error')
      expect(error.message).toBe(ApiError.fallbackMessage)
    }
  })

  it('names common statuses', () => {
    expect(ApiError.fromResponse(401, null).isUnauthorized).toBe(true)
    expect(ApiError.fromResponse(401, null).code).toBe('unauthenticated')
    expect(ApiError.fromResponse(429, null).code).toBe('rate_limited')
  })

  it('describes network failures', () => {
    const error = ApiError.network()

    expect(error.status).toBe(0)
    expect(error.isNetworkError).toBe(true)
    expect(error.code).toBe('network_error')
    expect(error.message).toBe("Can't reach the server. Check your connection and try again.")
    expect(error.isUnauthorized).toBe(false)
    expect(error.isNotFound).toBe(false)
  })
})
