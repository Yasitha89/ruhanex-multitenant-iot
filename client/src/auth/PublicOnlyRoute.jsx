import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "./AuthContext";

export default function PublicOnlyRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="full-page-center">
        <Spin size="large" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}
