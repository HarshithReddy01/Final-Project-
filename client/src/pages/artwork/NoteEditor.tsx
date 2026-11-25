import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/Button/Button.tsx'
import { TextArea } from '../../components/TextArea/TextArea.tsx'
import { useFavorites, useUpdateFavoriteNote } from '../../hooks/useFavorites.ts'
import { ApiError } from '../../lib/http/ApiError.ts'
import { Favorite } from '../../lib/vitrine/Favorite.ts'
import typography from '../../styles/typography.module.css'
import styles from './NoteEditor.module.css'

type NoteEditorProps = {
  readonly objectId: number
}

export function NoteEditor({ objectId }: NoteEditorProps) {
  const { collection } = useFavorites()
  const favorite = collection.get(objectId)
  if (favorite === null) return null
  return <NoteForm key={objectId} favorite={favorite} />
}

type NoteFormProps = {
  readonly favorite: Favorite
}

function NoteForm({ favorite }: NoteFormProps) {
  const [note, setNote] = useState(favorite.note)
  const update = useUpdateFavoriteNote()
  const isChanged = note.trim() !== favorite.note

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isChanged) update.mutate({ objectId: favorite.objectId, note })
  }

  const handleChange = (value: string) => {
    setNote(value)
    if (!update.isIdle && !update.isPending) update.reset()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextArea
        label="Your note"
        hint="Only you can see this."
        rows={5}
        maxLength={Favorite.maxNoteLength}
        showCount
        value={note}
        error={NoteFeedback.problem(update.error)}
        onChange={(event) => handleChange(event.target.value)}
      />
      <div className={styles.actions}>
        <Button type="submit" size="small" disabled={!isChanged} pending={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save note'}
        </Button>
        <output className={typography.label}>{update.isSuccess ? 'Note saved' : ''}</output>
      </div>
    </form>
  )
}

class NoteFeedback {
  static problem(error: Error | null): string | null {
    if (error === null) return null
    if (error instanceof ApiError) return error.fieldError('note') ?? error.message
    return 'Your note wasn’t saved. Try again.'
  }
}
