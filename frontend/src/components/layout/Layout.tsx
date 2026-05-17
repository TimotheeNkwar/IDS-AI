import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Suspense, useEffect } from "react";
import Loader from "../Loader";
import { useThemeStore } from "../../stores/themeStore";

export default function Layout() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light", "system");
    root.classList.add(theme);
  }, [theme]);

  return (
    <Sidebar>
      <Suspense fallback={<Loader />}>
        <Outlet />
      </Suspense>
    </Sidebar>
  );
}
