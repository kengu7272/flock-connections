import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute("/_auth/flock")({
  component: Flock,
})

function Flock() {
  return (
    <div>
      
    </div>
  )
}
