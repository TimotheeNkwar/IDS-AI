import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Suspense } from "react";
import Loader from "../Loader";

export default function Layout() {
  return (
    <Sidebar>
      <Suspense fallback={<Loader />}>
        <Outlet />
      </Suspense>
    </Sidebar>
  );
}
