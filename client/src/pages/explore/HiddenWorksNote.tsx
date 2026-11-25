import { Button } from '../../components/Button/Button.tsx'
import { TextFormat } from '../../lib/format/TextFormat.ts'
import styles from './HiddenWorksNote.module.css'

type HiddenWorksNoteProps = {
  readonly count: number
  readonly onShow: () => void
}

export function HiddenWorksNote({ count, onShow }: HiddenWorksNoteProps) {
  const isSingle = count === 1
  return (
    <p className={styles.note}>
      <span>
        {TextFormat.count(count, 'work', 'works')} on this page {isSingle ? 'has' : 'have'} no open-access image.
      </span>
      <Button variant="quiet" size="small" onClick={onShow}>
        Show {isSingle ? 'it' : 'them'}
      </Button>
    </p>
  )
}
