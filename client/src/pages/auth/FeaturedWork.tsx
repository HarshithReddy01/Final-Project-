import { useState } from 'react'
import { ArtworkCaption } from '../../components/ArtworkCaption/ArtworkCaption.tsx'
import { ArtworkFrame } from '../../components/ArtworkFrame/ArtworkFrame.tsx'
import { useArtwork } from '../../hooks/useCollection.ts'
import styles from './FeaturedWork.module.css'

class FeaturedWorks {
  static readonly #objectIds = [436535, 435809, 39799, 437853, 436105, 438821, 459123, 11417] as const

  static pick(): number {
    const index = Math.floor(Math.random() * FeaturedWorks.#objectIds.length)
    return FeaturedWorks.#objectIds[index] ?? FeaturedWorks.#objectIds[0]
  }
}

export function FeaturedWork() {
  const [objectId] = useState(() => FeaturedWorks.pick())
  const artwork = useArtwork(objectId)

  return (
    <aside className={styles.feature} aria-label="From the collection">
      {artwork.isSuccess ? (
        <figure className={styles.figure}>
          <ArtworkFrame
            src={artwork.data.primaryImage?.displayUrl ?? null}
            alt={artwork.data.altText}
            title={artwork.data.title}
            loading="eager"
          />
          <figcaption>
            <ArtworkCaption
              title={artwork.data.title}
              maker={artwork.data.maker}
              date={artwork.data.date}
              size="large"
            />
          </figcaption>
        </figure>
      ) : (
        <div className={styles.placeholder} />
      )}
    </aside>
  )
}
