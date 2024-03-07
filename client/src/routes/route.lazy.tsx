import { Link, createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="w-full flex justify-center items-center text-center lg:text-left">
      <main className="mt-24 px-2 lg:px-80 flex flex-col items-center gap-16 lg:gap-24">
        <div className="w-full flex flex-col gap-2">
          <h1 className="text-3xl lg:text-5xl font-bold">Flock Connections</h1>
          <span className="text-sm text-slate-300">
            The Group Social Media App
          </span>
        </div>
        <p>
          Typical social media apps are usually based on individual users and accounts. We wanted to change it up.
          The idea is that multiple users will share one account. Everything in <strong>Flock Connections </strong> 
          will require at least half of the group members (rounded up) to do anything important. This includes making 
          posts, adding/removing members, creating chats with other groups, and much more.
        </p>
        <Link to="/flock" className="px-4 py-3 bg-sky-600 hover:bg-sky-700 rounded-md">Flock Connections</Link>
      </main>
    </div>
  );
}
