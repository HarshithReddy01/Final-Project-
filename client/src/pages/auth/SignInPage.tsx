import { AuthForm } from './AuthForm.tsx'
import { AuthLayout } from './AuthLayout.tsx'

export function SignInPage() {
  return (
    <AuthLayout title="Sign in">
      <AuthForm mode="sign-in" />
    </AuthLayout>
  )
}
