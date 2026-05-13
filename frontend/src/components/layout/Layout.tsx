import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  );
}
