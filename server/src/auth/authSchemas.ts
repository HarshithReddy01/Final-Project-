import { z } from 'zod'
import type { Credentials } from './AuthService.ts'
import { PasswordHasher } from './PasswordHasher.ts'

export const registrationSchema = z.object({
  username: z
    .string('Enter a username.')
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(32, 'Use at most 32 characters.')
    .regex(/^[A-Za-z0-9_.-]+$/, 'Use letters, numbers, dots, dashes or underscores.'),
  password: z
    .string('Enter a password.')
    .min(8, 'Use at least 8 characters.')
    .refine(PasswordHasher.fitsLimit, `Use at most ${PasswordHasher.maxPasswordBytes} bytes.`),
}) satisfies z.ZodType<Credentials>

export const loginSchema = z.object({
  username: z.string('Enter your username.').trim().min(1, 'Enter your username.'),
  password: z.string('Enter your password.').min(1, 'Enter your password.'),
}) satisfies z.ZodType<Credentials>
