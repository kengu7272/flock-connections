import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_auth/flock/$flockId/create/')({
  component: () => <div>Hello /_auth/flock/$flockId/create/!</div>
})