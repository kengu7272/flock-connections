import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_notLoggedIn/login/")({
  component: Login,
});

function Login() {
  return (
    <div className="flex">
      <main className="mx-auto mt-32 flex flex-col justify-center gap-10 rounded-lg bg-slate-700 px-16 py-6 lg:px-32">
        <h2 className="text-xl">Login with Google</h2>
        <a
          href="/api/login/google"
          className="mx-auto rounded-lg bg-red-700 px-6 py-3 font-semibold text-slate-100 hover:bg-red-800 active:bg-red-900"
        >
          Google
        </a>
      </main>
    </div>
  );
}
