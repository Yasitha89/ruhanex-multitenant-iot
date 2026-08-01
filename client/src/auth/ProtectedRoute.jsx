import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="full-page-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
