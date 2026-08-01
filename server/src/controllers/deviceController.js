import Device from "../models/Device.js";
import Site from "../models/Site.js";

const DEVICE_TYPES = [
  "production_line",
  "energy_meter",
  "temperature_sensor",
  "flow_meter",
  "pressure_sensor",
  "machine_monitor",
  "other",
];

const DASHBOARD_TYPES = [
  "production",
  "energy",
  "temperature",
  "process",
  "machine",
  "generic",
];

const STATUSES = ["active", "inactive", "maintenance"];
const PROTOCOLS = [
  "mqtt",
  "modbus_tcp",
  "modbus_rtu",
  "http",
  "opc_ua",
  "manual",
];

function optionalNumber(value) {
  return value === "" || value === null || value === undefined
    ? null
    : Number(value);
}

function normalizeDeviceCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function normalizeInput(body = {}) {
  return {
    siteId: String(body.siteId || "").trim(),
    name: String(body.name || "").trim(),
    deviceCode: normalizeDeviceCode(body.deviceCode),
    deviceType: String(body.deviceType || "").trim(),
    dashboardType: String(body.dashboardType || "").trim(),
    description: String(body.description || "").trim(),
    status: String(body.status || "active").trim(),
    communication: {
      protocol: String(body.communication?.protocol || "mqtt").trim(),
      mqttTopic: String(body.communication?.mqttTopic || "").trim(),
      ipAddress: String(body.communication?.ipAddress || "").trim(),
      port: optionalNumber(body.communication?.port),
      slaveId: optionalNumber(body.communication?.slaveId),
    },
    configuration: {
      panelName: String(body.configuration?.panelName || "").trim(),
      ratedSpeed: optionalNumber(body.configuration?.ratedSpeed),
      tileSize: String(body.configuration?.tileSize || "").trim(),
      plannedDowntimeMinutes: Number(
        body.configuration?.plannedDowntimeMinutes || 0,
      ),
      measurementUnit: String(body.configuration?.measurementUnit || "").trim(),
    },
    navigation: {
      visible: body.navigation?.visible !== false,
      sortOrder: Number(body.navigation?.sortOrder || 0),
    },
  };
}

function validateInput(input) {
  if (
    !input.siteId ||
    !input.name ||
    !input.deviceCode ||
    !input.deviceType ||
    !input.dashboardType
  ) {
    return "Site, name, device code, device type and dashboard type are required";
  }

  if (!DEVICE_TYPES.includes(input.deviceType)) return "Invalid device type";
  if (!DASHBOARD_TYPES.includes(input.dashboardType))
    return "Invalid dashboard type";
  if (!STATUSES.includes(input.status)) return "Invalid device status";
  if (!PROTOCOLS.includes(input.communication.protocol)) {
    return "Invalid communication protocol";
  }

  return null;
}

export async function getDevices(req, res, next) {
  try {
    const filter = { tenantId: req.user.tenantId };

    if (req.query.siteId) filter.siteId = req.query.siteId;
    if (req.query.deviceType) filter.deviceType = req.query.deviceType;
    if (req.query.status) filter.status = req.query.status;

    const devices = await Device.find(filter)
      .populate("siteId", "name code status")
      .sort({ "navigation.sortOrder": 1, name: 1 })
      .lean();

    return res.json({ success: true, devices });
  } catch (error) {
    next(error);
  }
}

export async function getNavigationDevices(req, res, next) {
  try {
    const filter = {
      tenantId: req.user.tenantId,

      status: {
        $in: ["active", "maintenance"],
      },

      "navigation.visible": true,
    };

    const isRestrictedUser =
      req.user.role !== "company_admin" &&
      Array.isArray(req.user.allowedSiteIds) &&
      req.user.allowedSiteIds.length > 0;

    if (isRestrictedUser) {
      filter.siteId = {
        $in: req.user.allowedSiteIds,
      };
    }

    const devices = await Device.find(filter)
      .populate({
        path: "siteId",
        match: {
          tenantId: req.user.tenantId,
          status: "active",
        },
        select: "name code",
      })
      .select(
        [
          "name",
          "deviceCode",
          "deviceType",
          "dashboardType",
          "status",
          "connectivity",
          "siteId",
          "navigation",
        ].join(" "),
      )
      .sort({
        "navigation.sortOrder": 1,
        name: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      devices: devices.filter((device) => Boolean(device.siteId)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeviceById(req, res, next) {
  try {
    const device = await Device.findOne({
      _id: req.params.deviceId,
      tenantId: req.user.tenantId,
    })
      .populate("siteId", "name code status timezone")
      .lean();

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      });
    }

    return res.json({ success: true, device });
  } catch (error) {
    next(error);
  }
}

export async function createDevice(req, res, next) {
  try {
    const input = normalizeInput(req.body);
    const validationError = validateInput(input);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError,
      });
    }

    const currentCount = await Device.countDocuments({
      tenantId: req.user.tenantId,
      status: { $ne: "inactive" },
    });

    if (currentCount >= req.tenant.limits.devices) {
      return res.status(403).json({
        success: false,
        error: "Your company has reached its active device limit",
      });
    }

    const site = await Site.findOne({
      _id: input.siteId,
      tenantId: req.user.tenantId,
      status: "active",
    }).lean();

    if (!site) {
      return res.status(400).json({
        success: false,
        error: "The selected site does not exist or is inactive",
      });
    }

    const duplicate = await Device.findOne({
      tenantId: req.user.tenantId,
      deviceCode: input.deviceCode,
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: "This device code is already in use",
      });
    }

    const device = await Device.create({
      tenantId: req.user.tenantId,
      ...input,
      createdBy: req.user.userId,
    });

    await device.populate("siteId", "name code status");

    return res.status(201).json({ success: true, device });
  } catch (error) {
    next(error);
  }
}

export async function updateDevice(req, res, next) {
  try {
    const input = normalizeInput(req.body);
    const validationError = validateInput(input);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError,
      });
    }

    const site = await Site.findOne({
      _id: input.siteId,
      tenantId: req.user.tenantId,
      status: "active",
    }).lean();

    if (!site) {
      return res.status(400).json({
        success: false,
        error: "The selected site does not exist or is inactive",
      });
    }

    const duplicate = await Device.findOne({
      tenantId: req.user.tenantId,
      deviceCode: input.deviceCode,
      _id: { $ne: req.params.deviceId },
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: "This device code is already in use",
      });
    }

    const device = await Device.findOneAndUpdate(
      {
        _id: req.params.deviceId,
        tenantId: req.user.tenantId,
      },
      {
        $set: {
          ...input,
          updatedBy: req.user.userId,
        },
      },
      { new: true, runValidators: true },
    ).populate("siteId", "name code status");

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      });
    }

    return res.json({ success: true, device });
  } catch (error) {
    next(error);
  }
}

export async function deactivateDevice(req, res, next) {
  try {
    const device = await Device.findOneAndUpdate(
      {
        _id: req.params.deviceId,
        tenantId: req.user.tenantId,
      },
      {
        $set: {
          status: "inactive",
          "navigation.visible": false,
          updatedBy: req.user.userId,
        },
      },
      { new: true, runValidators: true },
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      });
    }

    return res.json({
      success: true,
      message: "Device deactivated successfully",
      device,
    });
  } catch (error) {
    next(error);
  }
}
