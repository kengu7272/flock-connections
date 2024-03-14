import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { client } from "~/client/utils/trpc";
import Sidebar from "../components/Sidebar";

export const Route = createFileRoute("/_auth")({
  // let's do this for now and see if there is a better way later
  beforeLoad: async () => {
    const data = await client.base.loggedIn.query();
    if (!data.loggedIn) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <Outlet />
    </div>
  );
}
