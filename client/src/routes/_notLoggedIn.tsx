import { createFileRoute, Outlet } from "@tanstack/react-router";

import Navbar from "../components/Navbar";

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
