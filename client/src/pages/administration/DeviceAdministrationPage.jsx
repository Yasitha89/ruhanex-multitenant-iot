import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  EditOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createDevice,
  deactivateDevice,
  getDevices,
  updateDevice,
} from "../../api/deviceApi";
import { getSites } from "../../api/siteApi";
import { useDevices } from "../../devices/DeviceContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

const deviceTypes = [
  ["production_line", "Production line"],
  ["energy_meter", "Energy meter"],
  ["temperature_sensor", "Temperature sensor"],
  ["flow_meter", "Flow meter"],
  ["pressure_sensor", "Pressure sensor"],
  ["machine_monitor", "Machine monitor"],
  ["other", "Other"],
].map(([value, label]) => ({ value, label }));

const dashboardTypes = [
  "production",
  "energy",
  "temperature",
  "process",
  "machine",
  "generic",
].map((value) => ({
  value,
  label: `${value[0].toUpperCase()}${value.slice(1)} dashboard`,
}));

const protocols = [
  "mqtt",
  "modbus_tcp",
  "modbus_rtu",
  "http",
  "opc_ua",
  "manual",
].map((value) => ({
  value,
  label: value.replaceAll("_", " ").toUpperCase(),
}));

function defaultValues() {
  return {
    status: "active",
    deviceType: "production_line",
    dashboardType: "production",
    communication: { protocol: "mqtt" },
    configuration: { plannedDowntimeMinutes: 0 },
    navigation: { visible: true, sortOrder: 0 },
  };
}

export default function DeviceAdministrationPage() {
  const [form] = Form.useForm();
  const [devices, setDevices] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const { refreshNavigationDevices } = useDevices();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deviceResult, siteResult] = await Promise.all([
        getDevices(),
        getSites(),
      ]);
      setDevices(deviceResult.devices || []);
      setSites(siteResult.sites || []);
    } catch (error) {
      message.error(error.message || "Unable to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const siteOptions = useMemo(
    () =>
      sites
        .filter((site) => site.status === "active")
        .map((site) => ({
          value: site._id,
          label: `${site.name} (${site.code})`,
        })),
    [sites]
  );

  function openCreate() {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue(defaultValues());
    setDrawerOpen(true);
  }

  function openEdit(device) {
    setEditingDevice(device);
    form.setFieldsValue({
      ...device,
      siteId: device.siteId?._id || device.siteId,
    });
    setDrawerOpen(true);
  }

  async function save(values) {
    setSaving(true);
    try {
      if (editingDevice) {
        await updateDevice(editingDevice._id, values);
        message.success("Device updated successfully");
      } else {
        await createDevice(values);
        message.success("Device added successfully");
      }

      setDrawerOpen(false);
      await Promise.all([loadData(), refreshNavigationDevices()]);
    } catch (error) {
      message.error(error.message || "Unable to save device");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(deviceId) {
    try {
      await deactivateDevice(deviceId);
      message.success("Device deactivated successfully");
      await Promise.all([loadData(), refreshNavigationDevices()]);
    } catch (error) {
      message.error(error.message || "Unable to deactivate device");
    }
  }

  const columns = [
    {
      title: "Device",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.deviceCode}</Text>
        </Space>
      ),
    },
    { title: "Site", render: (_, record) => record.siteId?.name || "—" },
    {
      title: "Type",
      dataIndex: "deviceType",
      render: (value) => value.replaceAll("_", " "),
    },
    { title: "Dashboard", dataIndex: "dashboardType" },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => (
        <Tag color={value === "active" ? "green" : value === "maintenance" ? "orange" : "default"}>
          {value.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Sidebar",
      render: (_, record) =>
        record.navigation?.visible ? <Tag color="blue">Visible</Tag> : <Tag>Hidden</Tag>,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          {record.status !== "inactive" && (
            <Popconfirm
              title="Deactivate this device?"
              onConfirm={() => deactivate(record._id)}
            >
              <Button danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <div className="page-heading">
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              Device Administration
            </Title>
            <Text type="secondary">
              Add devices and control sidebar visibility.
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Device
          </Button>
        </div>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={devices}
          loading={loading}
          scroll={{ x: 1000 }}
          style={{ marginTop: 24 }}
        />
      </Card>

      <Drawer
        title={editingDevice ? "Edit Device" : "Add Device"}
        width={640}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="siteId" label="Site" rules={[{ required: true }]}>
            <Select options={siteOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="name" label="Device name" rules={[{ required: true }]}>
            <Input placeholder="Keda 1" />
          </Form.Item>
          <Form.Item name="deviceCode" label="Device code" rules={[{ required: true }]}>
            <Input placeholder="KEDA_01" />
          </Form.Item>
          <Form.Item name="deviceType" label="Device type" rules={[{ required: true }]}>
            <Select options={deviceTypes} />
          </Form.Item>
          <Form.Item name="dashboardType" label="Dashboard type" rules={[{ required: true }]}>
            <Select options={dashboardTypes} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: "active", label: "Active" },
                { value: "maintenance", label: "Maintenance" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>

          <Title level={5}>Communication</Title>
          <Form.Item name={["communication", "protocol"]} label="Protocol">
            <Select options={protocols} />
          </Form.Item>
          <Form.Item name={["communication", "mqttTopic"]} label="MQTT topic">
            <Input />
          </Form.Item>
          <Form.Item name={["communication", "ipAddress"]} label="IP address">
            <Input />
          </Form.Item>
          <Space size={16}>
            <Form.Item name={["communication", "port"]} label="Port">
              <InputNumber min={1} max={65535} />
            </Form.Item>
            <Form.Item name={["communication", "slaveId"]} label="Slave ID">
              <InputNumber min={1} max={247} />
            </Form.Item>
          </Space>

          <Title level={5}>Dashboard configuration</Title>
          <Form.Item name={["configuration", "panelName"]} label="Panel name">
            <Input />
          </Form.Item>
          <Form.Item name={["configuration", "ratedSpeed"]} label="Rated line speed">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name={["configuration", "tileSize"]} label="Tile size">
            <Input placeholder="60x30" />
          </Form.Item>
          <Form.Item
            name={["configuration", "plannedDowntimeMinutes"]}
            label="Planned downtime (minutes)"
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name={["configuration", "measurementUnit"]} label="Measurement unit">
            <Input placeholder="m², kWh, °C" />
          </Form.Item>

          <Title level={5}>Navigation</Title>
          <Form.Item
            name={["navigation", "visible"]}
            label="Show in sidebar"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name={["navigation", "sortOrder"]} label="Sidebar order">
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
