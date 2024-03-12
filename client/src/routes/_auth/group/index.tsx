import { createFileRoute, redirect } from '@tanstack/react-router'
import { client } from '~/client/utils/trpc'

export const Route = createFileRoute('/_auth/group/')({
  beforeLoad: async ({}) => {
    const group = await client.user.getGroup.query()
    if (group) throw redirect({ to: "/flock", replace: true })
  }
})
