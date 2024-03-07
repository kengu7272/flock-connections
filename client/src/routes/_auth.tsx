import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import Sidebar from "../components/sidebar";

export const Route = createFileRoute("/_auth")({
  // let's do this for now and see if there is a better way later
  beforeLoad: async () => {
    const res = await fetch("/api/loggedIn", { method: "GET", credentials: "include"});
    if (res.status !== 200) throw redirect({ to: "/login" });
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
