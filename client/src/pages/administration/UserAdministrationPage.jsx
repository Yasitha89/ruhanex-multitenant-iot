import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import {
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSites,
} from "../../api/siteApi";

import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
} from "../../api/userApi";

import {
  useAuth,
} from "../../auth/AuthContext";

const { Title, Text } = Typography;

const ROLE_OPTIONS = [
  {
    value: "company_admin",
    label: "Company Administrator",
  },
  {
    value: "engineer",
    label: "Engineer",
  },
  {
    value: "supervisor",
    label: "Supervisor",
  },
  {
    value: "viewer",
    label: "Viewer",
  },
];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "disabled",
    label: "Disabled",
  },
];

function roleLabel(role) {
  return (
    ROLE_OPTIONS.find(
      (option) =>
        option.value === role
    )?.label || role
  );
}

function getInitialValues() {
  return {
    role: "viewer",
    status: "active",
    allowedSiteIds: [],
  };
}

export default function UserAdministrationPage() {
  const [form] = Form.useForm();
  const [passwordForm] =
    Form.useForm();

  const { user: currentUser } =
    useAuth();

  const [users, setUsers] =
    useState([]);

  const [sites, setSites] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [resettingPassword, setResettingPassword] =
    useState(false);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [passwordModalOpen, setPasswordModalOpen] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const [passwordUser, setPasswordUser] =
    useState(null);

  const loadData =
    useCallback(async () => {
      setLoading(true);

      try {
        const [
          userResult,
          siteResult,
        ] = await Promise.all([
          getUsers(),
          getSites(),
        ]);

        setUsers(
          Array.isArray(
            userResult.users
          )
            ? userResult.users
            : []
        );

        setSites(
          Array.isArray(
            siteResult.sites
          )
            ? siteResult.sites
            : []
        );
      } catch (error) {
        message.error(
          error.message ||
            "Unable to load users"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const siteOptions =
    useMemo(
      () =>
        sites
          .filter(
            (site) =>
              site.status === "active"
          )
          .map((site) => ({
            value: site._id,
            label:
              `${site.name} (${site.code})`,
          })),
      [sites]
    );

  function openCreateDrawer() {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue(
      getInitialValues()
    );
    setDrawerOpen(true);
  }

  function openEditDrawer(record) {
    setEditingUser(record);

    form.resetFields();

    form.setFieldsValue({
      name: record.name,
      email: record.email,
      role: record.role,
      status: record.status,
      allowedSiteIds:
        Array.isArray(
          record.allowedSiteIds
        )
          ? record.allowedSiteIds.map(
              (site) =>
                typeof site === "string"
                  ? site
                  : site._id
            )
          : [],
    });

    setDrawerOpen(true);
  }

  function openPasswordModal(record) {
    setPasswordUser(record);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  }

  async function handleSave(values) {
    setSaving(true);

    try {
      if (editingUser) {
        await updateUser(
          editingUser._id ||
            editingUser.id,
          {
            name: values.name,
            role: values.role,
            status: values.status,
            allowedSiteIds:
              values.allowedSiteIds ||
              [],
          }
        );

        message.success(
          "User updated successfully"
        );
      } else {
        await createUser({
          name: values.name,
          email: values.email,
          password:
            values.password,
          role: values.role,
          allowedSiteIds:
            values.allowedSiteIds ||
            [],
        });

        message.success(
          "User created successfully"
        );
      }

      setDrawerOpen(false);
      form.resetFields();
      await loadData();
    } catch (error) {
      message.error(
        error.message ||
          "Unable to save user"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset(
    values
  ) {
    if (!passwordUser) {
      return;
    }

    setResettingPassword(true);

    try {
      await resetUserPassword(
        passwordUser._id ||
          passwordUser.id,
        values.password
      );

      message.success(
        "Password reset successfully"
      );

      setPasswordModalOpen(false);
      setPasswordUser(null);
      passwordForm.resetFields();
    } catch (error) {
      message.error(
        error.message ||
          "Unable to reset password"
      );
    } finally {
      setResettingPassword(false);
    }
  }

  const columns = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <Space
          direction="vertical"
          size={0}
        >
          <Text strong>
            {record.name}
          </Text>

          <Text type="secondary">
            {record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (value) =>
        roleLabel(value),
    },
    {
      title: "Site access",
      key: "sites",
      render: (_, record) => {
        const assignedSites =
          Array.isArray(
            record.allowedSiteIds
          )
            ? record.allowedSiteIds
            : [];

        if (
          assignedSites.length === 0
        ) {
          return (
            <Tag color="blue">
              All sites
            </Tag>
          );
        }

        return (
          <Space wrap>
            {assignedSites.map(
              (site) => (
                <Tag
                  key={
                    typeof site ===
                    "string"
                      ? site
                      : site._id
                  }
                >
                  {typeof site ===
                  "string"
                    ? site
                    : site.name}
                </Tag>
              )
            )}
          </Space>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag
          color={
            value === "active"
              ? "green"
              : "default"
          }
        >
          {value.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Last login",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (value) =>
        value
          ? new Date(
              value
            ).toLocaleString()
          : "Never",
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, record) => {
        const isCurrentUser =
          String(
            record._id ||
              record.id
          ) ===
          String(
            currentUser?.userId ||
              currentUser?.id
          );

        return (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                openEditDrawer(
                  record
                )
              }
            >
              Edit
            </Button>

            <Button
              icon={<KeyOutlined />}
              onClick={() =>
                openPasswordModal(
                  record
                )
              }
            >
              Password
            </Button>

            {isCurrentUser && (
              <Tag color="blue">
                You
              </Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <div className="page-heading">
          <div>
            <Title
              level={2}
              style={{
                marginBottom: 4,
              }}
            >
              User Administration
            </Title>

            <Text type="secondary">
              Add company users, assign roles,
              and control site access.
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={
              openCreateDrawer
            }
          >
            Add User
          </Button>
        </div>

        <Table
          rowKey={(record) =>
            record._id ||
            record.id
          }
          columns={columns}
          dataSource={users}
          loading={loading}
          scroll={{ x: 1050 }}
          style={{
            marginTop: 24,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>

      <Drawer
        title={
          editingUser
            ? "Edit User"
            : "Add User"
        }
        width={560}
        open={drawerOpen}
        onClose={() =>
          setDrawerOpen(false)
        }
        extra={
          <Space>
            <Button
              onClick={() =>
                setDrawerOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              type="primary"
              loading={saving}
              onClick={() =>
                form.submit()
              }
            >
              Save
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSave}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Enter the user's name",
              },
            ]}
          >
            <Input placeholder="Dashboard Viewer" />
          </Form.Item>

          <Form.Item
            label="Email address"
            name="email"
            rules={[
              {
                required:
                  !editingUser,
                message:
                  "Enter an email address",
              },
              {
                type: "email",
                message:
                  "Enter a valid email address",
              },
            ]}
          >
            <Input
              placeholder="viewer@company.com"
              disabled={
                Boolean(editingUser)
              }
            />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="Temporary password"
              name="password"
              rules={[
                {
                  required: true,
                  message:
                    "Enter a temporary password",
                },
                {
                  min: 10,
                  message:
                    "Use at least 10 characters",
                },
              ]}
            >
              <Input.Password
                autoComplete="new-password"
                placeholder="At least 10 characters"
              />
            </Form.Item>
          )}

          <Form.Item
            label="Role"
            name="role"
            rules={[
              {
                required: true,
                message:
                  "Select a role",
              },
            ]}
          >
            <Select
              options={ROLE_OPTIONS}
            />
          </Form.Item>

          {editingUser && (
            <Form.Item
              label="Status"
              name="status"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select
                options={
                  STATUS_OPTIONS
                }
              />
            </Form.Item>
          )}

          <Form.Item
            label="Allowed sites"
            name="allowedSiteIds"
            extra="Leave empty to allow access to all company sites."
          >
            <Select
              mode="multiple"
              showSearch
              allowClear
              optionFilterProp="label"
              options={siteOptions}
              placeholder="All sites"
            />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={`Reset password${
          passwordUser
            ? ` — ${passwordUser.name}`
            : ""
        }`}
        open={
          passwordModalOpen
        }
        onCancel={() => {
          setPasswordModalOpen(
            false
          );
          setPasswordUser(null);
        }}
        onOk={() =>
          passwordForm.submit()
        }
        confirmLoading={
          resettingPassword
        }
        okText="Reset Password"
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={
            handlePasswordReset
          }
        >
          <Form.Item
            label="New temporary password"
            name="password"
            rules={[
              {
                required: true,
                message:
                  "Enter a new password",
              },
              {
                min: 10,
                message:
                  "Use at least 10 characters",
              },
            ]}
          >
            <Input.Password
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            label="Confirm password"
            name="confirmPassword"
            dependencies={[
              "password",
            ]}
            rules={[
              {
                required: true,
                message:
                  "Confirm the password",
              },
              ({ getFieldValue }) => ({
                validator(
                  _,
                  value
                ) {
                  if (
                    !value ||
                    getFieldValue(
                      "password"
                    ) === value
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "Passwords do not match"
                    )
                  );
                },
              }),
            ]}
          >
            <Input.Password
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
