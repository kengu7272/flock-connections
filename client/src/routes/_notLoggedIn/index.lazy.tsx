import { createLazyFileRoute, Link } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_notLoggedIn/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex w-full items-center justify-center text-center lg:text-left">
      <main className="mt-24 flex flex-col items-center gap-16 px-2 lg:gap-24 lg:px-80">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-3xl font-bold lg:text-5xl">Flock Connections</h1>
          <span className="text-sm text-slate-300">
            The Group Social Media App
          </span>
        </div>
        <p>
          Typical social media apps are usually based on individual users and
          accounts. We wanted to change it up. The idea is that multiple users
          will share one account. Everything in{" "}
          <strong>Flock Connections </strong>
          will require at least half of the flock members (rounded up) to do
          anything important. This includes making posts, adding/removing
          members, creating chats with other flocks, and much more.
        </p>
        <Link
          to="/home"
          className="rounded-md bg-sky-600 px-4 py-3 hover:bg-sky-700 active:bg-sky-800 font-semibold"
        >
          Flock Connections
        </Link>
      </main>
    </div>
  );
}
