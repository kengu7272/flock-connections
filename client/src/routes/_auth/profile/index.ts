import { createFileRoute } from '@tanstack/react-router'
import { client } from '~/client/utils/trpc';

export const Route = createFileRoute('/_auth/profile/')({
  loader: async () => {
  const userInfo = await client.user.userInfo.query();
  const flock = await client.user.getFlock.query();

    return { userInfo, flock };
  }
})
