import { createFileRoute } from '@tanstack/react-router'
import { client } from '~/client/utils/trpc';

export const Route = createFileRoute('/_auth/home/')({
  loader: async () => {
    const initialFlockData = await client.user.getFlock.query();
    const initialInvitesData = await client.user.getOutstandingInvites.query();
  
    return { initialFlockData, initialInvitesData, }
  }
})
