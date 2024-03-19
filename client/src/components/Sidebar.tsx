import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import { Home, LogOut, Menu, User, Users } from "lucide-react";

import { trpc } from "~/client/utils/trpc";

export default function Sidebar() {
  const { data: loggedInData } = trpc.base.loggedIn.useQuery();
  const { data: flock } = trpc.user.getFlock.useQuery();

  const [mobileLinks, setMobileLinks] = useState(false);
  const linkClass = clsx({
    "rounded-lg py-3 text-center hover:bg-slate-700 lg:flex items-center justify-center gap-2 border border-slate-600 hidden":
      true,
    "!flex": mobileLinks,
  });

  const linkOnClick = () => setMobileLinks(false);

  return (
    <div>
      <div
        className={clsx({
          "fixed z-10 flex flex-col items-center justify-center gap-16 whitespace-nowrap px-4 py-6 lg:h-screen lg:w-72 lg:bg-slate-800":
            true,
          "h-screen !w-72 bg-slate-800": mobileLinks,
        })}
      >
        <button
          className={clsx({
            "absolute lg:hidden": true,
            "right-4 top-4": mobileLinks,
            "left-4 top-4": !mobileLinks,
          })}
          onClick={() => setMobileLinks((prev) => !prev)}
        >
          <Menu className="h-7 w-7" />
        </button>
        <div
          className={clsx({
            "absolute top-12 hidden flex-col items-center lg:flex": true,
            "!flex": mobileLinks,
          })}
        >
          <Link to="/" className="text-2xl font-bold hover:text-slate-400">
            Flock Connections
          </Link>
          <span className="text-lg font-semibold text-slate-300">
            {loggedInData?.username}
          </span>
          <span className="text-sm text-slate-300">
            {flock ? `${flock.flock.name}` : "No Flock"}
          </span>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Link onClick={linkOnClick} className={linkClass} to="/home">
            <Home />
            <span>Home</span>
          </Link>
          {flock && (
            <Link
              onClick={linkOnClick}
              className={linkClass}
              to={"/flock/" + flock.flock.name}
            >
              <Users />
              <span>Flock</span>
            </Link>
          )}
          <Link onClick={linkOnClick} className={linkClass} to="/profile">
            <User />
            <span>Profile</span>
          </Link>
          <a
            onClick={linkOnClick}
            href="/api/logout"
            className={linkClass + " hover:!bg-red-700"}
          >
            <LogOut />
            <span>Log Out</span>
          </a>
        </div>
      </div>
      <div
        className={clsx({
          "hidden px-4 py-6 lg:block lg:h-screen lg:w-72 lg:bg-slate-800": true,
          "h-screen !w-72 bg-slate-800": mobileLinks,
        })}
      ></div>
    </div>
  );
}
