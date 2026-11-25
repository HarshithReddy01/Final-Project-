import { AuthForm } from './AuthForm.tsx'
import { AuthLayout } from './AuthLayout.tsx'

export function RegisterPage() {
  return (
    <AuthLayout title="Create an account">
      <AuthForm mode="register" />
    </AuthLayout>
  )
}
