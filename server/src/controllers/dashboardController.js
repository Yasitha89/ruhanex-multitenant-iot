import Device from "../models/Device.js";
import { getProductionDashboardFromNodeRed } from "../services/nodeRedService.js";

const ALLOWED_SHIFTS = ["06-14", "14-22", "22-06"];

export async function getDeviceDashboard(req, res, next) {
  try {
    const { deviceId } = req.params;
    const shift = String(req.query.shift || "").trim();
    const shiftDate = String(req.query.shiftDate || "").trim();
    const fromTime = String(req.query.fromTime || "").trim();
    const toTime = String(req.query.toTime || "").trim();

    if (!shift || !shiftDate || !fromTime || !toTime) {
      return res.status(400).json({
        success: false,
        error: "shift, shiftDate, fromTime and toTime are required",
      });
    }

    if (!ALLOWED_SHIFTS.includes(shift)) {
      return res.status(400).json({ success: false, error: "Invalid shift" });
    }

    const fromMs = new Date(fromTime).getTime();
    const toMs = new Date(toTime).getTime();

    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs >= toMs) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid dashboard time range" });
    }

    const device = await Device.findOne({
      _id: deviceId,
      tenantId: req.user.tenantId,
      status: { $in: ["active", "maintenance"] },
    }).lean();

    if (!device) {
      return res
        .status(404)
        .json({ success: false, error: "Device not found" });
    }

    const hasSiteRestriction =
      req.user.role !== "company_admin" &&
      Array.isArray(req.user.allowedSiteIds) &&
      req.user.allowedSiteIds.length > 0;

    if (
      hasSiteRestriction &&
      !req.user.allowedSiteIds.includes(String(device.siteId))
    ) {
      return res.status(403).json({
        success: false,
        error: "You do not have access to this device",
      });
    }

    if (device.dashboardType !== "production") {
      return res.status(400).json({
        success: false,
        error: "This device does not use a production dashboard",
      });
    }

    const result = await getProductionDashboardFromNodeRed({
      tenantId: req.user.tenantId,
      deviceId: device._id.toString(),
      deviceCode: device.deviceCode,
      shift,
      shiftDate,
      fromTime,
      toTime,
    });

    return res.json({
      success: true,
      device: {
        id: device._id,
        name: device.name,
        deviceCode: device.deviceCode,
        dashboardType: device.dashboardType,
      },
      lineStats: result.lineStats || null,
    });
  } catch (error) {
    next(error);
  }
}
