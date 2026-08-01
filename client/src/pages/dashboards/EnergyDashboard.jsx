import {
  Card,
  Col,
  Descriptions,
  Row,
  Statistic,
  Typography,
} from "antd";

const { Title, Text } = Typography;

export default function EnergyDashboard({ device }) {
  return (
    <>
      <Title level={2} style={{ marginBottom: 4 }}>
        {device.name}
      </Title>
      <Text type="secondary">
        Energy dashboard placeholder. Connect this component to your
        existing Node-RED energy API using device._id.
      </Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}><Card><Statistic title="Active power" value={0} suffix="kW" /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Energy" value={0} suffix="kWh" /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Power factor" value={0} /></Card></Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Descriptions title="Meter configuration" bordered column={1}>
          <Descriptions.Item label="Panel">{device.configuration?.panelName || "—"}</Descriptions.Item>
          <Descriptions.Item label="Protocol">{device.communication?.protocol || "—"}</Descriptions.Item>
          <Descriptions.Item label="Slave ID">{device.communication?.slaveId ?? "—"}</Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}
