import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  LockOutlined,
  MailOutlined,
} from "@ant-design/icons";

import { useAuth } from "../auth/AuthContext";
import "./LoginPage.css";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination =
    location.state?.from && location.state.from !== "/login"
      ? location.state.from
      : "/";

  async function handleLogin(values) {
    setSubmitting(true);
    setLoginError("");

    try {
      await login({
        companyCode: values.companyCode.trim(),
        email: values.email.trim(),
        password: values.password,
      });

      navigate(destination, { replace: true });
    } catch (error) {
      setLoginError(error.message || "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-badge">R</div>
          <Title level={1} className="brand-title">
            Ruhanex Industrial IoT
          </Title>
          <Text className="brand-description">
            Monitor production, downtime, energy consumption and
            industrial performance from one secure platform.
          </Text>
        </div>
      </section>

      <section className="login-form-panel">
        <Card className="login-card" bordered={false}>
          <Space
            direction="vertical"
            size={4}
            style={{ width: "100%", marginBottom: 28 }}
          >
            <Title level={2} style={{ margin: 0 }}>
              Sign in
            </Title>
            <Text type="secondary">
              Enter your company and account details.
            </Text>
          </Space>

          {loginError && (
            <Alert
              type="error"
              showIcon
              message={loginError}
              style={{ marginBottom: 20 }}
            />
          )}

          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={handleLogin}
          >
            <Form.Item
              label="Company code"
              name="companyCode"
              rules={[{ required: true, message: "Enter your company code" }]}
            >
              <Input
                size="large"
                prefix={<ApartmentOutlined />}
                placeholder="ruhanex-demo"
              />
            </Form.Item>

            <Form.Item
              label="Email address"
              name="email"
              rules={[
                { required: true, message: "Enter your email address" },
                { type: "email", message: "Enter a valid email address" },
              ]}
            >
              <Input
                size="large"
                prefix={<MailOutlined />}
                placeholder="admin@company.com"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Enter your password" }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={submitting}
            >
              Sign in
            </Button>
          </Form>
        </Card>
      </section>
    </main>
  );
}
