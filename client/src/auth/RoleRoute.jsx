import { Alert, Card } from "antd";
import { Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Card>
        <Alert
          type="error"
          showIcon
          message="Access denied"
          description="You do not have permission to access this page."
        />
      </Card>
    );
  }

  return <Outlet />;
}
