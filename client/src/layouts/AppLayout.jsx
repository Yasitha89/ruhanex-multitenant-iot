import { useMemo } from "react";
import {
  Button,
  Layout,
  Menu,
  Space,
  Spin,
  Typography,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { useDevices } from "../devices/DeviceContext";
import { buildSidebarItems } from "./buildSidebarItems";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tenant, logout, hasRole } = useAuth();
  const { navigationDevices, loadingDevices } = useDevices();

  const items = useMemo(
    () =>
      buildSidebarItems({
        devices: navigationDevices,
        isCompanyAdmin: hasRole("company_admin"),
      }),
    [navigationDevices, hasRole]
  );

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={270} theme="dark" className="app-sider">
        <div className="sidebar-brand">
          <Text strong className="sidebar-company">
            {tenant?.branding?.companyDisplayName ||
              tenant?.name ||
              "Industrial IoT"}
          </Text>
          <Text className="sidebar-platform">Ruhanex Platform</Text>
        </div>

        {loadingDevices ? (
          <div className="sidebar-spinner">
            <Spin />
          </div>
        ) : (
          <Menu
            theme="dark"
            mode="inline"
            items={items}
            selectedKeys={[location.pathname]}
            onClick={({ key }) => {
              if (typeof key === "string" && key.startsWith("/")) {
                navigate(key);
              }
            }}
          />
        )}
      </Sider>

      <Layout>
        <Header className="app-header">
          <Space size={16}>
            <div className="header-user">
              <Text strong>{user?.name}</Text>
              <Text type="secondary">{user?.role}</Text>
            </div>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Log out
            </Button>
          </Space>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
