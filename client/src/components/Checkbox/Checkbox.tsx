import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.ts'
import { Icon } from '../Icon/Icon.tsx'
import styles from './Checkbox.module.css'

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  readonly label: string
}

export function Checkbox({ label, className, ...inputProps }: CheckboxProps) {
  return (
    <label className={cx(styles.checkbox, className)}>
      <span className={styles.box}>
        <input {...inputProps} type="checkbox" className={styles.input} />
        <Icon name="check" className={styles.mark} />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  )
}
