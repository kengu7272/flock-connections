import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/flock')({
  component: () => <div>Hello /flock!</div>
})
