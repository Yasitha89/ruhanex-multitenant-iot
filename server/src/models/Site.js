import mongoose from "mongoose";

const siteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    timezone: {
      type: String,
      default: "Asia/Colombo",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

siteSchema.index({ tenantId: 1, code: 1 }, { unique: true });
siteSchema.index({ tenantId: 1, status: 1, name: 1 });

export default mongoose.model("Site", siteSchema);
