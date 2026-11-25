import type { ComponentProps, MouseEvent } from 'react'
import { Link } from 'react-router'
import type { LinkProps } from 'react-router'
import { cx } from '../../lib/cx.ts'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet'

export type ButtonSize = 'regular' | 'small'

type ButtonAppearance = {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly block?: boolean
}

export type ButtonProps = ComponentProps<'button'> &
  ButtonAppearance & {
    readonly pending?: boolean
  }

export type ButtonLinkProps = LinkProps & ButtonAppearance

function buttonClassName(appearance: ButtonAppearance, className: string | undefined): string {
  const { variant = 'secondary', size = 'regular', block = false } = appearance
  return cx(styles.button, styles[variant], styles[size], block && styles.block, className)
}

export function Button({
  variant,
  size,
  block,
  pending = false,
  className,
  type = 'button',
  onClick,
  'aria-disabled': ariaDisabled,
  ...props
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      {...props}
      type={type}
      aria-disabled={pending || ariaDisabled}
      aria-busy={pending || undefined}
      className={buttonClassName({ variant, size, block }, className)}
      onClick={handleClick}
    />
  )
}

export function ButtonLink({ variant, size, block, className, ...props }: ButtonLinkProps) {
  return <Link {...props} className={buttonClassName({ variant, size, block }, className)} />
}
