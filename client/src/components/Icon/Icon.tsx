import type { ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import styles from './Icon.module.css'

export type IconName =
  | 'search'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'bookmark'
  | 'bookmark-filled'
  | 'close'
  | 'expand'
  | 'check'
  | 'chevron-down'

type IconProps = {
  readonly name: IconName
  readonly className?: string
}

const glyphs: Readonly<Record<IconName, ReactNode>> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="M15.25 15.25 20 20" />
    </>
  ),
  'arrow-left': <path d="M19.5 12h-15m6-6-6 6 6 6" />,
  'arrow-right': <path d="M4.5 12h15m-6-6 6 6-6 6" />,
  'arrow-up-right': <path d="M7 17 17 7M8.5 7H17v8.5" />,
  bookmark: <path d="M6.75 3.75h10.5v16.5L12 16.5l-5.25 3.75Z" />,
  'bookmark-filled': <path d="M6.75 3.75h10.5v16.5L12 16.5l-5.25 3.75Z" fill="currentColor" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  expand: <path d="M14.25 4.5h5.25v5.25m0-5.25-6 6M9.75 19.5H4.5v-5.25m0 5.25 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  'chevron-down': <path d="m6 9.75 6 6 6-6" />,
}

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={cx(styles.icon, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {glyphs[name]}
    </svg>
  )
}
