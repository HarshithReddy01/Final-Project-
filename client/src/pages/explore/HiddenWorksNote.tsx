import { useId } from 'react'
import { Button } from '../../components/Button/Button.tsx'
import { TextFormat } from '../../lib/format/TextFormat.ts'
import styles from './HiddenWorksNote.module.css'

type HiddenWorksNoteProps = {
  readonly count: number
  readonly isShowing: boolean
  readonly onToggle: () => void
}

export function HiddenWorksNote({ count, isShowing, onToggle }: HiddenWorksNoteProps) {
  const sentenceId = useId()
  const works = TextFormat.count(count, 'work', 'works')
  const isSingle = count === 1
  const sentence = isShowing
    ? `Showing ${works} without an open-access image.`
    : `${works} on this page ${isSingle ? 'has' : 'have'} no open-access image.`

  return (
    <div className={styles.note}>
      <output id={sentenceId}>{sentence}</output>
      <Button variant="quiet" size="small" aria-describedby={sentenceId} onClick={onToggle}>
        {isShowing ? 'Hide' : 'Show'} {isSingle ? 'it' : 'them'}
      </Button>
    </div>
  )
}
