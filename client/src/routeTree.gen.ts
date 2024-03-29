// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as NotLoggedInImport } from './routes/_notLoggedIn'
import { Route as AuthImport } from './routes/_auth'
import { Route as AuthProfileIndexImport } from './routes/_auth/profile/index'
import { Route as AuthFlockIndexImport } from './routes/_auth/flock/index'
import { Route as AuthFlockFlockIdIndexImport } from './routes/_auth/flock/$flockId/index'

// Create Virtual Routes

const NotLoggedInIndexLazyImport = createFileRoute('/_notLoggedIn/')()
const NotLoggedInLoginIndexLazyImport = createFileRoute(
  '/_notLoggedIn/login/',
)()
const AuthHomeIndexLazyImport = createFileRoute('/_auth/home/')()

// Create/Update Routes

const NotLoggedInRoute = NotLoggedInImport.update({
  id: '/_notLoggedIn',
  getParentRoute: () => rootRoute,
} as any)

const AuthRoute = AuthImport.update({
  id: '/_auth',
  getParentRoute: () => rootRoute,
} as any)

const NotLoggedInIndexLazyRoute = NotLoggedInIndexLazyImport.update({
  path: '/',
  getParentRoute: () => NotLoggedInRoute,
} as any).lazy(() =>
  import('./routes/_notLoggedIn/index.lazy').then((d) => d.Route),
)

const NotLoggedInLoginIndexLazyRoute = NotLoggedInLoginIndexLazyImport.update({
  path: '/login/',
  getParentRoute: () => NotLoggedInRoute,
} as any).lazy(() =>
  import('./routes/_notLoggedIn/login/index.lazy').then((d) => d.Route),
)

const AuthHomeIndexLazyRoute = AuthHomeIndexLazyImport.update({
  path: '/home/',
  getParentRoute: () => AuthRoute,
} as any).lazy(() =>
  import('./routes/_auth/home/index.lazy').then((d) => d.Route),
)

const AuthProfileIndexRoute = AuthProfileIndexImport.update({
  path: '/profile/',
  getParentRoute: () => AuthRoute,
} as any).lazy(() =>
  import('./routes/_auth/profile/index.lazy').then((d) => d.Route),
)

const AuthFlockIndexRoute = AuthFlockIndexImport.update({
  path: '/flock/',
  getParentRoute: () => AuthRoute,
} as any).lazy(() =>
  import('./routes/_auth/flock/index.lazy').then((d) => d.Route),
)

const AuthFlockFlockIdIndexRoute = AuthFlockFlockIdIndexImport.update({
  path: '/flock/$flockId/',
  getParentRoute: () => AuthRoute,
} as any).lazy(() =>
  import('./routes/_auth/flock/$flockId/index.lazy').then((d) => d.Route),
)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_auth': {
      preLoaderRoute: typeof AuthImport
      parentRoute: typeof rootRoute
    }
    '/_notLoggedIn': {
      preLoaderRoute: typeof NotLoggedInImport
      parentRoute: typeof rootRoute
    }
    '/_notLoggedIn/': {
      preLoaderRoute: typeof NotLoggedInIndexLazyImport
      parentRoute: typeof NotLoggedInImport
    }
    '/_auth/flock/': {
      preLoaderRoute: typeof AuthFlockIndexImport
      parentRoute: typeof AuthImport
    }
    '/_auth/profile/': {
      preLoaderRoute: typeof AuthProfileIndexImport
      parentRoute: typeof AuthImport
    }
    '/_auth/home/': {
      preLoaderRoute: typeof AuthHomeIndexLazyImport
      parentRoute: typeof AuthImport
    }
    '/_notLoggedIn/login/': {
      preLoaderRoute: typeof NotLoggedInLoginIndexLazyImport
      parentRoute: typeof NotLoggedInImport
    }
    '/_auth/flock/$flockId/': {
      preLoaderRoute: typeof AuthFlockFlockIdIndexImport
      parentRoute: typeof AuthImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  AuthRoute.addChildren([
    AuthFlockIndexRoute,
    AuthProfileIndexRoute,
    AuthHomeIndexLazyRoute,
    AuthFlockFlockIdIndexRoute,
  ]),
  NotLoggedInRoute.addChildren([
    NotLoggedInIndexLazyRoute,
    NotLoggedInLoginIndexLazyRoute,
  ]),
])
