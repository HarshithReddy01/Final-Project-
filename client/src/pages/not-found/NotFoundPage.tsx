import { ButtonLink } from '../../components/Button/Button.tsx'
import { Page } from '../../components/Page/Page.tsx'
import { PageHeader } from '../../components/PageHeader/PageHeader.tsx'

export function NotFoundPage() {
  return (
    <Page title="Not found">
      <PageHeader
        title="Not in the collection"
        lead="The page you were looking for doesn’t exist."
        actions={
          <ButtonLink to="/" variant="primary">
            Back to explore
          </ButtonLink>
        }
      />
    </Page>
  )
}
