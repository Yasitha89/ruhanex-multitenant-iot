import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import PublicOnlyRoute from "./auth/PublicOnlyRoute";
import RoleRoute from "./auth/RoleRoute";

import AppLayout from "./layouts/AppLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

import DeviceAdministrationPage from "./pages/administration/DeviceAdministrationPage";
import SiteAdministrationPage from "./pages/administration/SiteAdministrationPage";
import UserAdministrationPage from "./pages/administration/UserAdministrationPage";

import DeviceDashboardPage from "./pages/devices/DeviceDashboardPage";

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <PublicOnlyRoute />
        }
      >
        <Route
          path="/login"
          element={<LoginPage />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute />
        }
      >
        <Route
          element={<AppLayout />}
        >
          <Route
            index
            element={
              <DashboardPage />
            }
          />

          <Route
            path="devices/:deviceId/:dashboardType"
            element={
              <DeviceDashboardPage />
            }
          />

          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "company_admin",
                ]}
              />
            }
          >
            <Route
              path="administration/sites"
              element={
                <SiteAdministrationPage />
              }
            />

            <Route
              path="administration/devices"
              element={
                <DeviceAdministrationPage />
              }
            />

            <Route
              path="administration/users"
              element={
                <UserAdministrationPage />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}
