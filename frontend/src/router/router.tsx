import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore.ts";
import LoginPage from "../pages/auth/LoginPage";
import NetworkStatsPage from "../pages/network-stats/NetworkStatsPage.tsx";
import TrafficMonitorPage from "../pages/traffic-monitor/TrafficMonitorPage.tsx";
import ProfilePage from "../pages/profile/ProfilePage.tsx";
import ThreatsAnalysisPage from "../pages/threats-analysis/ThreatsAnalysisPage.tsx";
import SuggestionsPage from "../pages/suggestions/SuggestionsPage.tsx";
import HelpSupportPage from "../pages/help-support/HelpSupportPage.tsx";
import PreferencesPage from "../pages/preferences/PreferencesPage.tsx";
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
          <Route index element={<Navigate to="/traffic-monitor" />} />
          <Route path="traffic-monitor" element={<TrafficMonitorPage />} />
          <Route path="network-stats" element={<NetworkStatsPage />} />
          <Route path="threats-analysis" element={<ThreatsAnalysisPage />} />
          <Route path="suggested-actions" element={<SuggestionsPage />} />
          <Route path="*" element={<Navigate to="/404" />} />
          <Route path="help-support" element={<HelpSupportPage />} />
          <Route path="preferences" element={<PreferencesPage />} />

          <Route path="profile" element={<ProfilePage />} />
          <Route path="404" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

// const navItemsGeneral = [
//   {
//     name: "Traffic Monitor",
//     icon: <Network size={16} />,
//     path: "/traffic-monitor",
//   },
//   {
//     name: "Network Stats",
//     icon: <BarChart2 size={16} />,
//     path: "/network-stats",
//   },
//   {
//     name: "Threats Analysis",
//     icon: <ShieldAlert size={16} />,
//     path: "/threats-analysis",
//   },
//   {
//     name: "Recommendations",
//     icon: <Lightbulb size={16} />,
//     path: "/recommendations",
//   },
// ];

// const navItemsSuggestions = [
//   {
//     name: "Suggested Actions",
//     icon: <Lightbulb size={16} />,
//     path: "/suggested-actions",
//   },
// ];

// const navItemsSettings = [
//   {
//     name: "Preferences",
//     icon: <Settings size={16} />,
//     path: "/preferences",
//   },
//   {
//     name: "Help & Support",
//     icon: <HelpCircle size={16} />,
//     path: "/help",
//   },
// ];
