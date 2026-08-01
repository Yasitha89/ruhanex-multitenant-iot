import api from "./api";

export async function getProductionDashboard({ deviceId, shift, shiftDate }) {
  if (!deviceId) throw new Error("deviceId is required");

  const params = {};
  if (shift) params.shift = shift;
  if (shiftDate) params.shiftDate = shiftDate;

  const response = await api.get(`/devices/${deviceId}/dashboard`, { params });
  return response.data;
}
