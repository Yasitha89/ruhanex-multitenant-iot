import {
  Alert,
  Card,
  Descriptions,
  Typography,
} from "antd";

const { Title } = Typography;

export default function GenericDashboard({ device }) {
  return (
    <>
      <Title level={2}>{device.name}</Title>
      <Alert
        type="info"
        showIcon
        message="Dashboard template not implemented"
        description={`Create a dashboard component for "${device.dashboardType}".`}
      />
      <Card style={{ marginTop: 16 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Device code">{device.deviceCode}</Descriptions.Item>
          <Descriptions.Item label="Device type">{device.deviceType}</Descriptions.Item>
          <Descriptions.Item label="Dashboard type">{device.dashboardType}</Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}
