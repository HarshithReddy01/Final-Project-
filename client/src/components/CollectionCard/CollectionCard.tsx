import { Link, useLocation } from 'react-router'
import { useRemoveFavorite } from '../../hooks/useFavorites.ts'
import { TextFormat } from '../../lib/format/TextFormat.ts'
import { ReturnLocation } from '../../lib/routing/ReturnLocation.ts'
import type { Favorite } from '../../lib/vitrine/Favorite.ts'
import typography from '../../styles/typography.module.css'
import { ArtworkCaption } from '../ArtworkCaption/ArtworkCaption.tsx'
import { ArtworkFrame } from '../ArtworkFrame/ArtworkFrame.tsx'
import { Button } from '../Button/Button.tsx'
import styles from './CollectionCard.module.css'

type CollectionCardProps = {
  readonly favorite: Favorite
  readonly backLabel?: string
}

export function CollectionCard({ favorite, backLabel = 'Back to your collection' }: CollectionCardProps) {
  const remove = useRemoveFavorite()
  const location = useLocation()
  const origin = new ReturnLocation(`${location.pathname}${location.search}`, backLabel)
  const savedOn = TextFormat.date(favorite.createdAt)

  return (
    <li className={styles.card}>
      <Link to={`/artworks/${favorite.objectId}`} state={origin.toState()} className={styles.link}>
        <ArtworkFrame src={favorite.imageUrl} alt="" title={favorite.title} />
        <ArtworkCaption title={favorite.title} maker={favorite.artist} date={favorite.date} />
      </Link>
      {favorite.hasNote && <p className={styles.note}>{favorite.note}</p>}
      <div className={styles.footer}>
        {savedOn !== '' && <span className={typography.label}>Saved {savedOn}</span>}
        <Button
          variant="quiet"
          size="small"
          pending={remove.isPending}
          onClick={() => remove.mutate(favorite.objectId)}
        >
          Remove<span className="visually-hidden"> {favorite.title} from your collection</span>
        </Button>
      </div>
    </li>
  )
}
