import api from "./api";

export async function getProductionDashboard({
  deviceId,
  shift,
  shiftDate,
  fromTime,
  toTime,
}) {
  const response = await api.get(`/devices/${deviceId}/dashboard`, {
    params: { shift, shiftDate, fromTime, toTime },
  });

  return response.data;
}
