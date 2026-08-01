import {
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

function getDashboardPath(device) {
  return `/devices/${device._id}/${device.dashboardType}`;
}

function getDeviceIcon(device) {
  switch (device.dashboardType) {
    case "production":
      return <BarChartOutlined />;

    case "energy":
      return <ThunderboltOutlined />;

    case "temperature":
      return <ExperimentOutlined />;

    default:
      return <ApiOutlined />;
  }
}

function groupBySite(devices) {
  return devices.reduce((groups, device) => {
    const siteId = device.siteId?._id;

    if (!siteId) {
      return groups;
    }

    if (!groups[siteId]) {
      groups[siteId] = {
        site: device.siteId,
        devices: [],
      };
    }

    groups[siteId].devices.push(device);

    return groups;
  }, {});
}

function createSection(key, label, icon, devices) {
  if (!devices.length) {
    return null;
  }

  return {
    key,
    label,
    icon,
    children: devices.map((device) => ({
      key: getDashboardPath(device),
      label: device.name,
      icon: getDeviceIcon(device),
    })),
  };
}

export function buildSidebarItems({ devices, isCompanyAdmin }) {
  const items = [
    {
      key: "/",
      label: "Overview",
      icon: <AppstoreOutlined />,
    },
  ];

  Object.values(groupBySite(devices))
    .sort((a, b) => a.site.name.localeCompare(b.site.name))
    .forEach(({ site, devices: siteDevices }) => {
      const production = siteDevices.filter(
        (device) => device.dashboardType === "production",
      );

      const energy = siteDevices.filter(
        (device) => device.dashboardType === "energy",
      );

      const monitoring = siteDevices.filter(
        (device) => !["production", "energy"].includes(device.dashboardType),
      );

      const children = [
        createSection(
          `site-${site._id}-production`,
          "Production",
          <BarChartOutlined />,
          production,
        ),

        createSection(
          `site-${site._id}-energy`,
          "Energy",
          <ThunderboltOutlined />,
          energy,
        ),

        createSection(
          `site-${site._id}-monitoring`,
          "Monitoring",
          <ApiOutlined />,
          monitoring,
        ),
      ].filter(Boolean);

      items.push({
        key: `site-${site._id}`,
        label: site.name,
        icon: <DashboardOutlined />,
        children,
      });
    });

  if (isCompanyAdmin) {
    items.push({
      type: "divider",
    });

    items.push({
      key: "/administration",
      label: "Administration",
      icon: <SettingOutlined />,
      children: [
        {
          key: "/administration/sites",
          label: "Sites",
        },
        {
          key: "/administration/devices",
          label: "Devices",
        },
        {
          key: "/administration/users",
          label: "Users",
        },
      ],
    });
  }

  return items;
}
