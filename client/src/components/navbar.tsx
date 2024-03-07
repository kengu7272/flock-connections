import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CircleUserRound, Menu } from "lucide-react";

import { trpc } from "~/client/utils/trpc";

export default function Navbar() {
  const { data: loggedInData } = trpc.base.loggedIn.useQuery();

  const [profileMenu, setProfileMenu] = useState(false);
  const [mobileLinks, setMobileLinks] = useState(false);

  const links = {
    Home: "/",
    Flock: "/flock",
  };

  return (
    <div className="relative flex items-center gap-4 border-b border-slate-700 bg-slate-800 py-7 lg:justify-center">
      <span className="absolute left-14 text-xl font-bold lg:left-12">
        Flock Connections
      </span>
      <div className="hidden space-x-2 lg:flex">
        {Object.entries(links).map(([key, value]) => (
          <Link to={value} key={key} className="[&.active]:font-bold">
            {key}
          </Link>
        ))}
      </div>
      <div className="relative ml-3 flex items-center lg:hidden">
        <button onClick={() => setMobileLinks((prev) => !prev)}>
          <Menu className="h-8 w-8" />
        </button>
        {mobileLinks && (
          <div className="absolute left-0 top-full mt-2 flex min-w-32 flex-col gap-2 rounded-lg bg-slate-700 py-1">
            {Object.entries(links).map(([key, value]) => (
              <Link
                onClick={() => setMobileLinks((prev) => !prev)}
                to={value}
                key={key}
                className="w-full rounded-lg px-2 py-3 text-center hover:bg-slate-600 active:bg-slate-500 [&.active]:font-bold"
              >
                {key}
              </Link>
            ))}
          </div>
        )}
      </div>
      {loggedInData?.loggedIn ? (
        <div className="absolute right-3 flex items-center whitespace-nowrap lg:right-12">
          <button
            onClick={() => setProfileMenu((prev) => !prev)}
            className="hover:text-slate-100"
          >
            <span className="hidden lg:block">{loggedInData.username}</span>
            <CircleUserRound className="h-8 w-8 lg:hidden" />
          </button>
          {profileMenu && (
            <div className="absolute right-0 top-full mt-2 w-full min-w-32 rounded-lg bg-slate-700 py-1">
              <Link
                onClick={() => setProfileMenu(false)}
                className="block w-full rounded-lg py-3 text-center hover:bg-slate-600 active:bg-slate-500"
                to="/profile"
              >
                Profile
              </Link>
              <a
                href="/api/logout"
                className="block w-full rounded-lg py-3 text-center hover:bg-slate-600 active:bg-slate-500"
              >
                Log Out
              </a>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="absolute right-12 [&.active]:font-bold">
          Login
        </Link>
      )}
    </div>
  );
}
