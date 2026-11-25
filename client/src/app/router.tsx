import { createBrowserRouter } from 'react-router'
import { RequireAuth } from '../components/RequireAuth/RequireAuth.tsx'
import { ArtworkPage } from '../pages/artwork/ArtworkPage.tsx'
import { RegisterPage } from '../pages/auth/RegisterPage.tsx'
import { SignInPage } from '../pages/auth/SignInPage.tsx'
import { CollectionPage } from '../pages/collection/CollectionPage.tsx'
import { ExplorePage } from '../pages/explore/ExplorePage.tsx'
import { NotFoundPage } from '../pages/not-found/NotFoundPage.tsx'
import { RootLayout } from './RootLayout.tsx'
import { RouteErrorBoundary } from './RouteErrorBoundary.tsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <ExplorePage /> },
      { path: 'artworks/:objectId', element: <ArtworkPage /> },
      {
        path: 'collection',
        element: (
          <RequireAuth>
            <CollectionPage />
          </RequireAuth>
        ),
      },
      { path: 'sign-in', element: <SignInPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
