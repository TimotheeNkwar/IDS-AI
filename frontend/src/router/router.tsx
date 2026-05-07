import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore.ts";
import LoginPage from "../pages/auth/LoginPage";
import UsersPage from "../pages/users/UsersPage.tsx";
import ProfilePage from "../pages/profile/ProfilePage.tsx";

import Layout from "../components/layout/Layout.tsx";
import LoginLayout from "../components/layout/LoginLayout.tsx";
import NotFound from "../pages/unauthorized/NotFound.tsx";

const ProtectedRoute = ({
  children,
}: {
  children?: React.ReactNode;
  roles?: string[];
}) => {
  const { accessToken } = useAuthStore();

  if (!accessToken) return <Navigate to="/login" />;

  return <>{children}</>;
};

export default function Router() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <LoginLayout>
            <LoginPage />
          </LoginLayout>
        }
      />

      {/*  auth */}
      <Route
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/users" />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="404" element={<NotFound />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
}
