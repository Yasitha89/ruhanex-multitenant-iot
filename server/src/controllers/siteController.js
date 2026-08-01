import Site from "../models/Site.js";
import Device from "../models/Device.js";

function normalizeSiteCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
}

export async function getSites(req, res, next) {
  try {
    const sites = await Site.find({
      tenantId: req.user.tenantId,
    })
      .sort({ status: 1, name: 1 })
      .lean();

    return res.json({ success: true, sites });
  } catch (error) {
    next(error);
  }
}

export async function createSite(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    const code = normalizeSiteCode(req.body?.code);
    const description = String(req.body?.description || "").trim();
    const timezone = String(req.body?.timezone || req.tenant.timezone).trim();

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: "Site name and code are required",
      });
    }

    const currentCount = await Site.countDocuments({
      tenantId: req.user.tenantId,
    });

    if (currentCount >= req.tenant.limits.sites) {
      return res.status(403).json({
        success: false,
        error: "Your company has reached its site limit",
      });
    }

    const duplicate = await Site.findOne({
      tenantId: req.user.tenantId,
      code,
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: "This site code is already in use",
      });
    }

    const site = await Site.create({
      tenantId: req.user.tenantId,
      name,
      code,
      description,
      timezone,
      status: "active",
      createdBy: req.user.userId,
    });

    return res.status(201).json({ success: true, site });
  } catch (error) {
    next(error);
  }
}

export async function updateSite(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    const code = normalizeSiteCode(req.body?.code);
    const description = String(req.body?.description || "").trim();
    const timezone = String(req.body?.timezone || "").trim();
    const status = req.body?.status;

    if (!name || !code || !timezone) {
      return res.status(400).json({
        success: false,
        error: "Site name, code and timezone are required",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid site status",
      });
    }

    const duplicate = await Site.findOne({
      tenantId: req.user.tenantId,
      code,
      _id: { $ne: req.params.siteId },
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: "This site code is already in use",
      });
    }

    const site = await Site.findOneAndUpdate(
      {
        _id: req.params.siteId,
        tenantId: req.user.tenantId,
      },
      {
        $set: {
          name,
          code,
          description,
          timezone,
          status,
          updatedBy: req.user.userId,
        },
      },
      { new: true, runValidators: true }
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        error: "Site not found",
      });
    }

    return res.json({ success: true, site });
  } catch (error) {
    next(error);
  }
}

export async function deleteSite(req, res, next) {
  try {
    const deviceCount = await Device.countDocuments({
      tenantId: req.user.tenantId,
      siteId: req.params.siteId,
    });

    if (deviceCount > 0) {
      return res.status(409).json({
        success: false,
        error: "This site contains devices. Move or deactivate them first.",
      });
    }

    const site = await Site.findOneAndDelete({
      _id: req.params.siteId,
      tenantId: req.user.tenantId,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        error: "Site not found",
      });
    }

    return res.json({
      success: true,
      message: "Site deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
