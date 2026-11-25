import { useId } from 'react'
import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.ts'
import { FieldIds } from '../../lib/forms/FieldIds.ts'
import { Field } from '../Field/Field.tsx'
import fieldStyles from '../Field/Field.module.css'
import { Icon } from '../Icon/Icon.tsx'
import styles from './Select.module.css'

export type SelectProps = Omit<ComponentProps<'select'>, 'multiple'> & {
  readonly label: string
  readonly hideLabel?: boolean
  readonly hint?: string | null
  readonly error?: string | null
}

export function Select({
  label,
  hideLabel,
  hint,
  error,
  id,
  className,
  'aria-describedby': describedBy,
  ...selectProps
}: SelectProps) {
  const generatedId = useId()
  const ids = new FieldIds(id ?? generatedId)
  return (
    <Field ids={ids} label={label} hideLabel={hideLabel} hint={hint} error={error} className={className}>
      <div className={styles.control}>
        <select
          {...selectProps}
          id={ids.control}
          className={cx(fieldStyles.box, styles.select, error && fieldStyles.invalid)}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy({ hint, error }, describedBy)}
        />
        <Icon name="chevron-down" className={styles.chevron} />
      </div>
    </Field>
  )
}
