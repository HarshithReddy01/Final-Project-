import { useId } from 'react'
import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.ts'
import { FieldIds } from '../../lib/forms/FieldIds.ts'
import { Field } from '../Field/Field.tsx'
import fieldStyles from '../Field/Field.module.css'
import styles from './TextArea.module.css'

export type TextAreaProps = Omit<ComponentProps<'textarea'>, 'children'> & {
  readonly label: string
  readonly hideLabel?: boolean
  readonly hint?: string | null
  readonly error?: string | null
  readonly showCount?: boolean
}

export function TextArea({
  label,
  hideLabel,
  hint,
  error,
  showCount = false,
  id,
  className,
  value,
  maxLength,
  'aria-describedby': describedBy,
  ...textareaProps
}: TextAreaProps) {
  const generatedId = useId()
  const ids = new FieldIds(id ?? generatedId)
  const count =
    showCount && maxLength !== undefined && typeof value === 'string' ? (
      <span className={styles.count}>
        {value.length} / {maxLength}
      </span>
    ) : undefined

  return (
    <Field ids={ids} label={label} hideLabel={hideLabel} hint={hint} error={error} aside={count} className={className}>
      <textarea
        {...textareaProps}
        id={ids.control}
        value={value}
        maxLength={maxLength}
        className={cx(fieldStyles.box, styles.textarea, error && fieldStyles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy({ hint, error }, describedBy)}
      />
    </Field>
  )
}
