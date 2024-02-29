import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { trpc } from "~/client/utils/trpc";

export default function Navbar() {
  const { data: loggedInData } = trpc.base.loggedIn.useQuery();
  const [profileMenu, setProfileMenu] = useState(false);

  return (
    <div className="relative flex items-center justify-center gap-4 border-b border-slate-700 bg-slate-800 py-7">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{" "}
      <Link to="/about" className="[&.active]:font-bold">
        About
      </Link>
      <Link to="/flock" className="[&.active]:font-bold">
        Flock
      </Link>
      {loggedInData?.loggedIn ? (
        <button
          onClick={() => setProfileMenu((prev) => !prev)}
          className="absolute right-12 flex hover:text-slate-100"
        >
          {loggedInData.email} 
          {profileMenu && (
            <div className="absolute top-full mt-2 w-full rounded-lg bg-slate-700">
              <a href="/api/logout" className="hover:bg-slate-600 active:bg-slate-500 w-full rounded-lg h-12">Log Out</a>
            </div>
          )}
        </button>
      ) : (
        <Link to="/login" className="absolute right-12 [&.active]:font-bold">
          Login
        </Link>
      )}
    </div>
  );
}
