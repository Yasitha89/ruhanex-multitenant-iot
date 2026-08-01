import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: [true, "Company code is required"],
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    plan: {
      type: String,
      enum: ["starter", "professional", "enterprise"],
      default: "starter",
    },
    timezone: {
      type: String,
      default: "Asia/Colombo",
    },
    limits: {
      sites: { type: Number, default: 1, min: 1 },
      users: { type: Number, default: 5, min: 1 },
      devices: { type: Number, default: 5, min: 1 },
    },
    branding: {
      companyDisplayName: { type: String, trim: true },
      logoUrl: { type: String, default: null },
    },
  },
  { timestamps: true }
);

tenantSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model("Tenant", tenantSchema);
