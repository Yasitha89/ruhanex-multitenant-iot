import mongoose from "mongoose";

import Site from "../models/Site.js";
import User from "../models/User.js";

const ALLOWED_ROLES = [
  "company_admin",
  "engineer",
  "supervisor",
  "viewer",
];

const ALLOWED_STATUSES = [
  "active",
  "disabled",
];

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeSiteIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(String))];
}

async function validateTenantSites({
  tenantId,
  siteIds,
}) {
  if (siteIds.length === 0) {
    return {
      valid: true,
      siteIds: [],
    };
  }

  if (
    siteIds.some(
      (siteId) =>
        !mongoose.isValidObjectId(siteId)
    )
  ) {
    return {
      valid: false,
      error:
        "One or more selected site IDs are invalid",
    };
  }

  const sites = await Site.find({
    _id: {
      $in: siteIds,
    },
    tenantId,
    status: "active",
  })
    .select("_id")
    .lean();

  if (sites.length !== siteIds.length) {
    return {
      valid: false,
      error:
        "One or more selected sites do not belong to this company or are inactive",
    };
  }

  return {
    valid: true,
    siteIds: sites.map((site) =>
      site._id.toString()
    ),
  };
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    allowedSiteIds:
      user.allowedSiteIds || [],
    lastLoginAt:
      user.lastLoginAt || null,
    createdAt:
      user.createdAt,
    updatedAt:
      user.updatedAt,
  };
}

export async function getUsers(
  req,
  res,
  next
) {
  try {
    const users = await User.find({
      tenantId:
        req.user.tenantId,
    })
      .select(
        "_id name email role status allowedSiteIds lastLoginAt createdAt updatedAt"
      )
      .populate(
        "allowedSiteIds",
        "name code status"
      )
      .sort({
        name: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(
  req,
  res,
  next
) {
  try {
    const name = String(
      req.body?.name || ""
    ).trim();

    const email = normalizeEmail(
      req.body?.email
    );

    const password = String(
      req.body?.password || ""
    );

    const role = String(
      req.body?.role || "viewer"
    ).trim();

    const allowedSiteIds =
      normalizeSiteIds(
        req.body?.allowedSiteIds
      );

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error:
          "Name, email and password are required",
      });
    }

    if (
      !ALLOWED_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid user role",
      });
    }

    if (password.length < 10) {
      return res.status(400).json({
        success: false,
        error:
          "Password must contain at least 10 characters",
      });
    }

    const existingUser =
      await User.findOne({
        tenantId:
          req.user.tenantId,
        email,
      }).lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error:
          "This email is already registered for the company",
      });
    }

    const currentUserCount =
      await User.countDocuments({
        tenantId:
          req.user.tenantId,
        status: {
          $ne: "disabled",
        },
      });

    if (
      currentUserCount >=
      req.tenant.limits.users
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Your company has reached its active user limit",
      });
    }

    const siteValidation =
      await validateTenantSites({
        tenantId:
          req.user.tenantId,
        siteIds:
          allowedSiteIds,
      });

    if (!siteValidation.valid) {
      return res.status(400).json({
        success: false,
        error:
          siteValidation.error,
      });
    }

    const passwordHash =
      await User.hashPassword(
        password
      );

    const user = await User.create({
      tenantId:
        req.user.tenantId,
      name,
      email,
      passwordHash,
      role,
      status: "active",
      allowedSiteIds:
        siteValidation.siteIds,
    });

    return res.status(201).json({
      success: true,
      user:
        publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req,
  res,
  next
) {
  try {
    const name = String(
      req.body?.name || ""
    ).trim();

    const role = String(
      req.body?.role || ""
    ).trim();

    const status = String(
      req.body?.status || ""
    ).trim();

    const allowedSiteIds =
      normalizeSiteIds(
        req.body?.allowedSiteIds
      );

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "User name is required",
      });
    }

    if (
      !ALLOWED_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid user role",
      });
    }

    if (
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid user status",
      });
    }

    /*
     * Prevent an administrator from disabling their own account
     * through this page.
     */
    if (
      req.params.userId ===
        req.user.userId &&
      status === "disabled"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "You cannot disable your own account",
      });
    }

    const siteValidation =
      await validateTenantSites({
        tenantId:
          req.user.tenantId,
        siteIds:
          allowedSiteIds,
      });

    if (!siteValidation.valid) {
      return res.status(400).json({
        success: false,
        error:
          siteValidation.error,
      });
    }

    const user =
      await User.findOneAndUpdate(
        {
          _id:
            req.params.userId,
          tenantId:
            req.user.tenantId,
        },
        {
          $set: {
            name,
            role,
            status,
            allowedSiteIds:
              siteValidation.siteIds,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .select(
          "_id name email role status allowedSiteIds lastLoginAt createdAt updatedAt"
        )
        .populate(
          "allowedSiteIds",
          "name code status"
        );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(
  req,
  res,
  next
) {
  try {
    const password = String(
      req.body?.password || ""
    );

    if (password.length < 10) {
      return res.status(400).json({
        success: false,
        error:
          "Password must contain at least 10 characters",
      });
    }

    const passwordHash =
      await User.hashPassword(
        password
      );

    const user =
      await User.findOneAndUpdate(
        {
          _id:
            req.params.userId,
          tenantId:
            req.user.tenantId,
        },
        {
          $set: {
            passwordHash,
            passwordChangedAt:
              new Date(),
          },
        },
        {
          new: true,
        }
      ).select("_id");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
}
