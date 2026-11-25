import { z } from 'zod'
import type { FavoriteSnapshotDto } from './Favorite.ts'

const maxObjectId = 2_147_483_647
const objectIdMessage = `Use a whole number from 1 to ${maxObjectId}.`

const trimmedText = (maxLength: number) => z.string().trim().max(maxLength, `Use at most ${maxLength} characters.`)

export const favoriteParamsSchema = z.object({
  objectId: z
    .string()
    .regex(/^[1-9]\d*$/, objectIdMessage)
    .transform(Number)
    .pipe(z.number().max(maxObjectId, objectIdMessage)),
})

export const favoriteSnapshotSchema = z.object({
  title: trimmedText(500).min(1, 'Add a title.'),
  artist: trimmedText(300).default(''),
  date: trimmedText(120).default(''),
  medium: trimmedText(1000).default(''),
  department: trimmedText(120).default(''),
  imageUrl: z
    .url({
      protocol: /^https$/,
      hostname: /^images\.metmuseum\.org$/,
      normalize: true,
      error: 'Use an image hosted on images.metmuseum.org.',
    })
    .max(500, 'Use at most 500 characters.')
    .nullable()
    .default(null),
}) satisfies z.ZodType<FavoriteSnapshotDto>

export const favoriteNoteSchema = z.object({
  note: trimmedText(2000),
})
