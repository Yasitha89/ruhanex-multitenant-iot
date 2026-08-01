import {
  Card,
  Col,
  Row,
  Statistic,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  ApiOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import { useDevices } from "../devices/DeviceContext";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { tenant, user } = useAuth();
  const { navigationDevices } = useDevices();

  const siteIds = new Set(
    navigationDevices.map((device) => device.siteId?._id).filter(Boolean)
  );

  return (
    <>
      <Title level={2} style={{ marginBottom: 4 }}>
        Company Overview
      </Title>
      <Text type="secondary">
        Welcome to {tenant?.name}, {user?.name}.
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Active sites"
              value={siteIds.size}
              prefix={<ApartmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Visible devices"
              value={navigationDevices.length}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Current role"
              value={user?.role}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
