import { useRef, useState } from 'react'
import { ArtworkFrame } from '../../components/ArtworkFrame/ArtworkFrame.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { Icon } from '../../components/Icon/Icon.tsx'
import type { Artwork } from '../../lib/met/Artwork.ts'
import typography from '../../styles/typography.module.css'
import styles from './ArtworkViewer.module.css'

type ArtworkViewerProps = {
  readonly artwork: Artwork
}

export function ArtworkViewer({ artwork }: ArtworkViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isEnlarged, setIsEnlarged] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { images } = artwork
  const selected = images[selectedIndex] ?? null

  if (selected === null) {
    return (
      <div className={styles.viewer}>
        <ArtworkFrame src={null} alt={artwork.altText} title={artwork.title} aspect="natural" />
      </div>
    )
  }

  const enlarge = () => {
    setIsEnlarged(true)
    dialogRef.current?.showModal()
  }

  return (
    <div className={styles.viewer}>
      <button
        type="button"
        className={styles.trigger}
        onClick={enlarge}
        aria-label={`View ${artwork.title} at full size`}
      >
        <ArtworkFrame
          src={selected.displayUrl}
          alt={artwork.altText}
          title={artwork.title}
          aspect="natural"
          loading="eager"
        />
        <span className={styles.expand} aria-hidden="true">
          <Icon name="expand" />
        </span>
      </button>
      {images.length > 1 && (
        <div className={styles.views}>
          <p className={typography.label}>
            View {selectedIndex + 1} of {images.length}
          </p>
          <ul className={styles.thumbs} aria-label="Other views">
            {images.map((image, index) => (
              <li key={image.fullUrl}>
                <button
                  type="button"
                  className={styles.thumb}
                  aria-pressed={index === selectedIndex}
                  aria-label={`Show view ${index + 1} of ${images.length}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <ArtworkFrame src={image.displayUrl} alt="" title={artwork.title} aspect="1 / 1" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={`${artwork.title}, full size`}
        onClose={() => setIsEnlarged(false)}
      >
        <Button variant="secondary" size="small" className={styles.close} onClick={() => dialogRef.current?.close()}>
          <Icon name="close" />
          Close
        </Button>
        {isEnlarged && <img src={selected.fullUrl} alt={artwork.altText} className={styles.full} decoding="async" />}
      </dialog>
    </div>
  )
}
