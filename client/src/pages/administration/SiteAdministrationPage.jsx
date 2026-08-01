import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useState } from "react";

import {
  createSite,
  deleteSite,
  getSites,
  updateSite,
} from "../../api/siteApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SiteAdministrationPage() {
  const [form] = Form.useForm();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSites();
      setSites(Array.isArray(result.sites) ? result.sites : []);
    } catch (error) {
      message.error(error.message || "Unable to load sites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  function openCreate() {
    setEditingSite(null);
    form.resetFields();
    form.setFieldsValue({
      timezone: "Asia/Colombo",
      status: "active",
    });
    setModalOpen(true);
  }

  function openEdit(site) {
    setEditingSite(site);
    form.setFieldsValue(site);
    setModalOpen(true);
  }

  async function save(values) {
    setSaving(true);
    try {
      if (editingSite) {
        await updateSite(editingSite._id, values);
        message.success("Site updated successfully");
      } else {
        await createSite(values);
        message.success("Site created successfully");
      }
      setModalOpen(false);
      form.resetFields();
      await loadSites();
    } catch (error) {
      message.error(error.message || "Unable to save site");
    } finally {
      setSaving(false);
    }
  }

  async function remove(siteId) {
    try {
      await deleteSite(siteId);
      message.success("Site deleted successfully");
      await loadSites();
    } catch (error) {
      message.error(error.message || "Unable to delete site");
    }
  }

  const columns = [
    { title: "Site", dataIndex: "name" },
    { title: "Code", dataIndex: "code" },
    { title: "Timezone", dataIndex: "timezone" },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => (
        <Tag color={value === "active" ? "green" : "default"}>
          {value.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this site?"
            description="A site containing devices cannot be deleted."
            onConfirm={() => remove(record._id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
              Site Administration
            </Title>
            <Text type="secondary">
              Add factories and operating locations.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            Add Site
          </Button>
        </div>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={sites}
          loading={loading}
          style={{ marginTop: 24 }}
        />
      </Card>

      <Modal
        title={editingSite ? "Edit Site" : "Add Site"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item
            name="name"
            label="Site name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Horana Factory" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Site code"
            rules={[{ required: true }]}
          >
            <Input placeholder="HORANA" />
          </Form.Item>
          <Form.Item
            name="timezone"
            label="Timezone"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
