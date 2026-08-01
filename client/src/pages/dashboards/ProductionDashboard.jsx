import {
  Alert,
  Card,
  Col,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";

import { useCallback, useEffect, useRef, useState } from "react";

import { getProductionDashboard } from "../../api/dashboardApi";

const { Title, Text } = Typography;

const REFRESH_INTERVAL_MS = 5000;

function getStatusColor(status) {
  switch (
    String(status || "")
      .trim()
      .toLowerCase()
  ) {
    case "running":
      return "green";

    case "stopped":
      return "red";

    case "maintenance":
      return "orange";

    default:
      return "default";
  }
}

function dashboardDataIsEqual(previousData, nextData) {
  if (previousData === nextData) {
    return true;
  }

  if (!previousData || !nextData) {
    return false;
  }

  return (
    previousData.status === nextData.status &&
    previousData.ole === nextData.ole &&
    previousData.availability === nextData.availability &&
    previousData.performance === nextData.performance &&
    previousData.quality === nextData.quality &&
    previousData.tileCount === nextData.tileCount &&
    previousData.production === nextData.production &&
    previousData.productionUnit === nextData.productionUnit &&
    previousData.totalDowntimeMinutes === nextData.totalDowntimeMinutes &&
    previousData.formattedDowntime === nextData.formattedDowntime &&
    previousData.currentOpenStopMinutes === nextData.currentOpenStopMinutes &&
    previousData.isCurrentlyStopped === nextData.isCurrentlyStopped &&
    previousData.completedStops === nextData.completedStops
  );
}

export default function ProductionDashboard({ device }) {
  const [dashboardData, setDashboardData] = useState(null);

  const [requestInfo, setRequestInfo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  const requestInProgressRef = useRef(false);

  const isMountedRef = useRef(true);

  const loadDashboard = useCallback(
    async ({ initialLoad = false } = {}) => {
      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;

      if (initialLoad) {
        setLoading(true);
      }

      try {
        const result = await getProductionDashboard({
          deviceId: device._id,
        });

        if (!isMountedRef.current) {
          return;
        }

        const nextData = result.lineStats || null;

        setDashboardData((previousData) =>
          dashboardDataIsEqual(previousData, nextData)
            ? previousData
            : nextData,
        );

        setRequestInfo(result.shiftRange || null);

        setLastUpdated(new Date());

        setError("");
      } catch (requestError) {
        if (!isMountedRef.current) {
          return;
        }

        setError(requestError.message || "Unable to load production dashboard");
      } finally {
        requestInProgressRef.current = false;

        if (initialLoad && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [device._id],
  );

  useEffect(() => {
    isMountedRef.current = true;

    loadDashboard({
      initialLoad: true,
    });

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        loadDashboard();
      }
    }, REFRESH_INTERVAL_MS);

    function handleVisibilityChange() {
      if (!document.hidden) {
        loadDashboard();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMountedRef.current = false;

      window.clearInterval(intervalId);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <Card
        style={{
          minHeight: 300,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Spin size="large" tip="Loading production dashboard..." />
      </Card>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              marginBottom: 4,
            }}
          >
            {device.name}
          </Title>

          <Space wrap size={[12, 4]}>
            <Text type="secondary">Device: {device.deviceCode}</Text>

            {requestInfo && (
              <Text type="secondary">
                Shift: {requestInfo.shift}
                {" · "}
                {requestInfo.shiftDate}
              </Text>
            )}

            {requestInfo?.timezone && (
              <Text type="secondary">Timezone: {requestInfo.timezone}</Text>
            )}

            <Text type="secondary">Auto refresh: 5 seconds</Text>

            <Text type="secondary">
              Last updated:{" "}
              {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
            </Text>
          </Space>
        </div>

        <Tag
          color={error ? "red" : "green"}
          style={{
            marginTop: 8,
            width: "fit-content",
            height: "fit-content",
            padding: "3px 10px",
            fontSize: 13,
            lineHeight: "20px",
          }}
        >
          {error ? "Connection Error" : "Live"}
        </Tag>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Dashboard update failed"
          description={`${error}. The dashboard will automatically try again.`}
          style={{
            marginBottom: 16,
          }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Status"
              valueRender={() => (
                <Tag
                  color={getStatusColor(dashboardData?.status)}
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    padding: "3px 12px",
                    lineHeight: "22px",
                    borderRadius: 6,
                    margin: 0,
                  }}
                >
                  {dashboardData?.status || "Unknown"}
                </Tag>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="OLE"
              value={Number(dashboardData?.ole) || 0}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Production"
              value={Number(dashboardData?.production) || 0}
              precision={2}
              suffix={
                dashboardData?.productionUnit ||
                device.configuration?.measurementUnit ||
                "units"
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Availability"
              value={Number(dashboardData?.availability) || 0}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Performance"
              value={Number(dashboardData?.performance) || 0}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Quality"
              value={Number(dashboardData?.quality) || 0}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tile Count"
              value={Number(dashboardData?.tileCount) || 0}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Downtime"
              value={dashboardData?.formattedDowntime || "0h 0m"}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Stops"
              value={Number(dashboardData?.completedStops) || 0}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Stop"
              value={Number(dashboardData?.currentOpenStopMinutes) || 0}
              precision={1}
              suffix="min"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Machine State"
              value={dashboardData?.isCurrentlyStopped ? "Stopped" : "Running"}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
