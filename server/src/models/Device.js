import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    deviceCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },
    deviceType: {
      type: String,
      required: true,
      enum: [
        "production_line",
        "energy_meter",
        "temperature_sensor",
        "flow_meter",
        "pressure_sensor",
        "machine_monitor",
        "other"
      ],
      index: true,
    },
    dashboardType: {
      type: String,
      required: true,
      enum: ["production", "energy", "temperature", "process", "machine", "generic"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
      index: true,
    },
    connectivity: {
      status: {
        type: String,
        enum: ["online", "offline", "unknown"],
        default: "unknown",
      },
      lastSeenAt: { type: Date, default: null },
    },
    communication: {
      protocol: {
        type: String,
        enum: ["mqtt", "modbus_tcp", "modbus_rtu", "http", "opc_ua", "manual"],
        default: "mqtt",
      },
      mqttTopic: { type: String, trim: true, default: "" },
      ipAddress: { type: String, trim: true, default: "" },
      port: { type: Number, min: 1, max: 65535, default: null },
      slaveId: { type: Number, min: 1, max: 247, default: null },
    },
    configuration: {
      panelName: { type: String, trim: true, default: "" },
      ratedSpeed: { type: Number, min: 0, default: null },
      tileSize: { type: String, trim: true, default: "" },
      plannedDowntimeMinutes: { type: Number, min: 0, default: 0 },
      measurementUnit: { type: String, trim: true, default: "" },
    },
    navigation: {
      visible: { type: Boolean, default: true },
      sortOrder: { type: Number, default: 0 },
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

deviceSchema.index({ tenantId: 1, deviceCode: 1 }, { unique: true });
deviceSchema.index({ tenantId: 1, siteId: 1, status: 1, deviceType: 1 });
deviceSchema.index({ tenantId: 1, "navigation.visible": 1, "navigation.sortOrder": 1 });

export default mongoose.model("Device", deviceSchema);
