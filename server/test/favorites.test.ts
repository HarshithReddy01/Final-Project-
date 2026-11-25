import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FavoriteDto, FavoriteSnapshotDto } from '../src/favorites/Favorite.ts'
import { TestApp, type TestUser } from './support/TestApp.ts'

const sunflowers: FavoriteSnapshotDto = {
  title: 'Sunflowers',
  artist: 'Vincent van Gogh',
  date: '1887',
  medium: 'Oil on canvas',
  department: 'European Paintings',
  imageUrl: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg',
}

const madameRoulin: FavoriteSnapshotDto = {
  title: 'Madame Roulin and Her Baby',
  artist: 'Vincent van Gogh',
  date: '1888',
  medium: 'Oil on canvas',
  department: 'European Paintings',
  imageUrl: null,
}

const crossingTheDelaware: FavoriteSnapshotDto = {
  title: 'Washington Crossing the Delaware',
  artist: 'Emanuel Leutze',
  date: '1851',
  medium: 'Oil on canvas',
  department: 'The American Wing',
  imageUrl: null,
}

const notInCollection = { error: { code: 'not_found', message: 'That work is not in your collection.' } }

describe('favorites', () => {
  let app: TestApp
  let ada: TestUser

  beforeEach(async () => {
    app = await TestApp.create()
    ada = await app.signUp('ada')
  })

  afterEach(() => {
    app.close()
  })

  it.each([
    ['get', '/api/favorites'],
    ['put', '/api/favorites/436524'],
    ['patch', '/api/favorites/436524'],
    ['delete', '/api/favorites/436524'],
    ['get', '/api/favorites/436524/notes'],
  ] as const)('requires a session for %s %s', async (method, path) => {
    const response = await app.request()[method](path)

    expect(response.status).toBe(401)
    expect(response.get('WWW-Authenticate')).toBe('Bearer')
    expect(response.body).toEqual({ error: { code: 'unauthenticated', message: 'Sign in to continue.' } })
  })

  it('saves a work with an empty note', async () => {
    const response = await ada.put('/api/favorites/436524').send(sunflowers)
    const savedAt = app.clock.now().toISOString()

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      favorite: { objectId: 436524, ...sunflowers, note: '', createdAt: savedAt, updatedAt: savedAt },
    })
  })

  it('keeps the original favorite and its note when the work is saved again', async () => {
    const first = await ada.put('/api/favorites/436524').send(sunflowers)
    await ada.patch('/api/favorites/436524').send({ note: 'Seen in gallery 825.' })
    app.clock.advance(60_000)

    const again = await ada.put('/api/favorites/436524').send({ ...sunflowers, title: 'Sunflowers (study)' })

    expect(again.status).toBe(200)
    expect(again.body.favorite).toEqual({ ...first.body.favorite, note: 'Seen in gallery 825.' })
  })

  it('fills optional snapshot fields and trims text', async () => {
    const response = await ada.put('/api/favorites/11417').send({ title: '  Washington Crossing the Delaware  ' })

    expect(response.status).toBe(201)
    expect(response.body.favorite).toMatchObject({
      title: 'Washington Crossing the Delaware',
      artist: '',
      date: '',
      medium: '',
      department: '',
      imageUrl: null,
    })
  })

  it('requires a title', async () => {
    const response = await ada.put('/api/favorites/436524').send({ ...sunflowers, title: '   ' })

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({ title: 'Add a title.' })
  })

  it('lists favorites newest first', async () => {
    const saves = [
      [436524, sunflowers],
      [459123, madameRoulin],
      [11417, crossingTheDelaware],
    ] as const
    for (const [objectId, snapshot] of saves) {
      await ada.put(`/api/favorites/${objectId}`).send(snapshot)
      app.clock.advance(1000)
    }

    const response = await ada.get('/api/favorites')

    expect(response.status).toBe(200)
    expect(response.body.favorites.map((favorite: FavoriteDto) => favorite.objectId)).toEqual([11417, 459123, 436524])
  })

  it('trims a note and records when it changed', async () => {
    await ada.put('/api/favorites/436524').send(sunflowers)
    const savedAt = app.clock.now().toISOString()
    app.clock.advance(5000)

    const response = await ada.patch('/api/favorites/436524').send({ note: '  Painted in Paris, 1887.  ' })

    expect(response.status).toBe(200)
    expect(response.body.favorite).toMatchObject({
      note: 'Painted in Paris, 1887.',
      createdAt: savedAt,
      updatedAt: app.clock.now().toISOString(),
    })
  })

  it('accepts notes up to 2000 characters', async () => {
    await ada.put('/api/favorites/436524').send(sunflowers)

    const atLimit = await ada.patch('/api/favorites/436524').send({ note: 'n'.repeat(2000) })
    const overLimit = await ada.patch('/api/favorites/436524').send({ note: 'n'.repeat(2001) })

    expect(atLimit.status).toBe(200)
    expect(overLimit.status).toBe(400)
    expect(overLimit.body.error.fields).toEqual({ note: 'Use at most 2000 characters.' })
  })

  it('cannot add a note to a work that is not saved', async () => {
    const response = await ada.patch('/api/favorites/436524').send({ note: 'Seen in gallery 825.' })

    expect(response.status).toBe(404)
    expect(response.body).toEqual(notInCollection)
  })

  it('removes a favorite once', async () => {
    await ada.put('/api/favorites/436524').send(sunflowers)

    const removed = await ada.delete('/api/favorites/436524')
    const removedAgain = await ada.delete('/api/favorites/436524')
    const list = await ada.get('/api/favorites')

    expect(removed.status).toBe(204)
    expect(removedAgain.status).toBe(404)
    expect(removedAgain.body).toEqual(notInCollection)
    expect(list.body).toEqual({ favorites: [] })
  })

  it.each([
    'http://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg',
    'https://example.com/CRDImages/ep/web-large/DP-41223-001.jpg',
    'https://images.metmuseum.org.example.com/DP-41223-001.jpg',
    'javascript:alert(1)',
    'DP-41223-001.jpg',
  ])('rejects the image URL %s', async (imageUrl) => {
    const response = await ada.put('/api/favorites/436524').send({ ...sunflowers, imageUrl })

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({ imageUrl: 'Use an image hosted on images.metmuseum.org.' })
  })

  it('stores Met image URLs in canonical form', async () => {
    const response = await ada
      .put('/api/favorites/436524')
      .send({ ...sunflowers, imageUrl: 'https://IMAGES.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg' })

    expect(response.body.favorite.imageUrl).toBe(sunflowers.imageUrl)
  })

  it.each(['0', '-1', '1.5', '1e3', 'sunflowers', '2147483648'])('rejects the object id %s', async (objectId) => {
    const response = await ada.put(`/api/favorites/${objectId}`).send(sunflowers)

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({ objectId: 'Use a whole number from 1 to 2147483647.' })
  })

  it('validates the object id on every route that takes one', async () => {
    const patch = await ada.patch('/api/favorites/sunflowers').send({ note: 'Seen in gallery 825.' })
    const remove = await ada.delete('/api/favorites/0')

    expect(patch.status).toBe(400)
    expect(remove.status).toBe(400)
  })

  it('accepts the largest object id', async () => {
    const response = await ada.put('/api/favorites/2147483647').send(sunflowers)

    expect(response.status).toBe(201)
    expect(response.body.favorite.objectId).toBe(2_147_483_647)
  })

  it('keeps every collection private to its owner', async () => {
    const grace = await app.signUp('grace')
    await ada.put('/api/favorites/436524').send(sunflowers)
    await ada.patch('/api/favorites/436524').send({ note: 'Seen in gallery 825.' })

    const graceList = await grace.get('/api/favorites')
    const graceNote = await grace.patch('/api/favorites/436524').send({ note: 'Overwritten.' })
    const graceRemove = await grace.delete('/api/favorites/436524')
    const graceSave = await grace.put('/api/favorites/436524').send(sunflowers)
    const adaList = await ada.get('/api/favorites')

    expect(graceList.body).toEqual({ favorites: [] })
    expect(graceNote.status).toBe(404)
    expect(graceRemove.status).toBe(404)
    expect(graceSave.status).toBe(201)
    expect(graceSave.body.favorite.note).toBe('')
    expect(adaList.body.favorites).toHaveLength(1)
    expect(adaList.body.favorites[0].note).toBe('Seen in gallery 825.')
  })
})
