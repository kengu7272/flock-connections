import { createFileRoute, Outlet } from "@tanstack/react-router";

import Navbar from "../components/navbar";

export const Route = createFileRoute("/_notLoggedIn")({
  component: NotLoggedInLayout,
});

function NotLoggedInLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
