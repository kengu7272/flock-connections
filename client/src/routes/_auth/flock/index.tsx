import { createFileRoute, redirect } from '@tanstack/react-router'
import { client } from '~/client/utils/trpc'

export const Route = createFileRoute('/_auth/flock/')({
  beforeLoad: async ({}) => {
    const flock = await client.user.getFlock.query()
    if (flock) throw redirect({ to: "/home", replace: true })
  }
})
