import { useEffect, useState } from "react";
import {
  Alert,
  Card,
  Spin,
} from "antd";
import {
  Navigate,
  useParams,
} from "react-router-dom";

import { getDevice } from "../../api/deviceApi";
import ProductionDashboard from "../dashboards/ProductionDashboard";
import EnergyDashboard from "../dashboards/EnergyDashboard";
import GenericDashboard from "../dashboards/GenericDashboard";

export default function DeviceDashboardPage() {
  const { deviceId, dashboardType } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDevice() {
      setLoading(true);
      setError("");

      try {
        const result = await getDevice(deviceId);
        if (active) setDevice(result.device);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load device");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDevice();
    return () => {
      active = false;
    };
  }, [deviceId]);

  if (loading) {
    return (
      <Card className="dashboard-loader">
        <Spin size="large" />
      </Card>
    );
  }

  if (error) {
    return <Alert type="error" showIcon message="Unable to open dashboard" description={error} />;
  }

  if (!device) return <Navigate to="/" replace />;

  if (dashboardType !== device.dashboardType) {
    return (
      <Navigate
        replace
        to={`/devices/${device._id}/${device.dashboardType}`}
      />
    );
  }

  if (device.dashboardType === "production") {
    return <ProductionDashboard device={device} />;
  }

  if (device.dashboardType === "energy") {
    return <EnergyDashboard device={device} />;
  }

  return <GenericDashboard device={device} />;
}
