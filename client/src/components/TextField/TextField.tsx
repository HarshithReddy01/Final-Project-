import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx.ts'
import { FieldIds } from '../../lib/forms/FieldIds.ts'
import { Field } from '../Field/Field.tsx'
import fieldStyles from '../Field/Field.module.css'
import styles from './TextField.module.css'

export type TextFieldProps = Omit<ComponentProps<'input'>, 'children'> & {
  readonly label: string
  readonly hideLabel?: boolean
  readonly hint?: string | null
  readonly error?: string | null
  readonly action?: ReactNode
}

export function TextField({
  label,
  hideLabel,
  hint,
  error,
  action,
  id,
  className,
  'aria-describedby': describedBy,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId()
  const ids = new FieldIds(id ?? generatedId)
  return (
    <Field ids={ids} label={label} hideLabel={hideLabel} hint={hint} error={error} className={className}>
      <div className={cx(fieldStyles.box, styles.box, error && fieldStyles.invalid)}>
        <input
          {...inputProps}
          id={ids.control}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy({ hint, error }, describedBy)}
        />
        {action !== undefined && <div className={styles.action}>{action}</div>}
      </div>
    </Field>
  )
}
