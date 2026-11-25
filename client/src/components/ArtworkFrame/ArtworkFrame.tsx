import { useState } from 'react'
import type { CSSProperties } from 'react'
import { cx } from '../../lib/cx.ts'
import typography from '../../styles/typography.module.css'
import styles from './ArtworkFrame.module.css'

export type FrameAspect = `${number} / ${number}` | 'natural'

type ArtworkFrameProps = {
  readonly src: string | null
  readonly alt: string
  readonly title: string
  readonly aspect?: FrameAspect
  readonly loading?: 'lazy' | 'eager'
  readonly className?: string
}

export function ArtworkFrame({ src, alt, title, aspect = '4 / 5', loading = 'lazy', className }: ArtworkFrameProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const natural = aspect === 'natural'
  const showImage = src !== null && src !== '' && failedSrc !== src
  const loaded = showImage && loadedSrc === src
  const style: CSSProperties | undefined = natural ? undefined : { aspectRatio: aspect }

  return (
    <div
      className={cx(
        styles.frame,
        natural ? styles.natural : styles.fixed,
        natural && showImage && !loaded && styles.awaiting,
        className,
      )}
      style={style}
    >
      {showImage ? (
        <img
          className={cx(styles.image, loaded && styles.loaded)}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={loading === 'eager' ? 'high' : undefined}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className={styles.placeholder} aria-hidden={alt === '' || undefined}>
          <span className={cx(typography.label, styles.placeholderLabel)}>Image not available</span>
          <span className={cx(typography.artworkTitle, styles.placeholderTitle)}>{title}</span>
        </div>
      )}
    </div>
  )
}
