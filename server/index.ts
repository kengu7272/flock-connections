import { Hono } from 'hono'
import { trpcServer } from '@hono/trpc-server' // Deno 'npm:@hono/trpc-server'
import { appRouter } from './router'
import "./env.ts";
import login from "./api/login";

const hono = new Hono()

hono.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
  })
)
console.log('Server running on port 3000')

hono.route('api/login', login);

hono.notFound((c) => {
  return c.text('Nothing Here', 404)
})

export default hono
