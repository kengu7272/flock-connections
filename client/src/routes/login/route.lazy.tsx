import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/login')({
  component: Login,
})

function Login() {
  return (
    <div className='flex'>
      <main className='mx-auto flex flex-col gap-10 justify-center mt-32 rounded-lg bg-slate-700 py-6 px-16 lg:px-32'>
        <h2 className='text-xl'>Login with Google</h2>
        <a href='/api/login/google' className='bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg px-6 py-3 mx-auto'>Google</a>
      </main>
    </div>
  )
}
