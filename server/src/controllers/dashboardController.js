import Device from "../models/Device.js";
import Tenant from "../models/Tenant.js";
import { getProductionDashboardFromNodeRed } from "../services/nodeRedService.js";
import { resolveCompanyShift } from "../utils/shiftTime.js";

export async function getDeviceDashboard(req, res, next) {
  try {
    const { deviceId } = req.params;
    const requestedShift = String(req.query.shift || "").trim();
    const requestedShiftDate = String(req.query.shiftDate || "").trim();

    const device = await Device.findOne({
      _id: deviceId,
      tenantId: req.user.tenantId,
      status: { $in: ["active", "maintenance"] },
    }).lean();

    if (!device) {
      return res.status(404).json({ success: false, error: "Device not found" });
    }

    const hasSiteRestriction =
      req.user.role !== "company_admin" &&
      Array.isArray(req.user.allowedSiteIds) &&
      req.user.allowedSiteIds.length > 0;

    if (
      hasSiteRestriction &&
      !req.user.allowedSiteIds.some((siteId) => String(siteId) === String(device.siteId))
    ) {
      return res.status(403).json({ success: false, error: "You do not have access to this device" });
    }

    if (device.dashboardType !== "production") {
      return res.status(400).json({
        success: false,
        error: "This device does not use a production dashboard",
      });
    }

    const tenant = await Tenant.findOne({
      _id: req.user.tenantId,
      status: "active",
    })
      .select("timezone shifts")
      .lean();

    if (!tenant) {
      return res.status(404).json({ success: false, error: "Company configuration not found" });
    }

    let shiftRange;
    try {
      shiftRange = resolveCompanyShift({
        shifts: tenant.shifts,
        timezoneName: tenant.timezone || "Asia/Colombo",
        shiftName: requestedShift || null,
        shiftDate: requestedShiftDate || null,
      });
    } catch (shiftError) {
      return res.status(400).json({ success: false, error: shiftError.message });
    }

    const result = await getProductionDashboardFromNodeRed({
      tenantId: req.user.tenantId,
      deviceId: device._id.toString(),
      deviceCode: device.deviceCode,
      shift: shiftRange.shift,
      shiftDate: shiftRange.shiftDate,
      fromTime: shiftRange.fromTime,
      toTime: shiftRange.toTime,
    });

    return res.status(200).json({
      success: true,
      device: {
        id: device._id,
        name: device.name,
        deviceCode: device.deviceCode,
        dashboardType: device.dashboardType,
        siteId: device.siteId,
      },
      shiftRange: {
        shift: shiftRange.shift,
        shiftDate: shiftRange.shiftDate,
        timezone: shiftRange.timezone,
        fromTime: shiftRange.fromTime,
        toTime: shiftRange.toTime,
        startLocal: shiftRange.startLocal,
        endLocal: shiftRange.endLocal,
        crossesMidnight: shiftRange.crossesMidnight,
      },
      lineStats: result.lineStats || null,
    });
  } catch (error) {
    next(error);
  }
}
