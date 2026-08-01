import api from "./api";

export async function getDevices(params = {}) {
  const response = await api.get("/devices", { params });
  return response.data;
}

export async function getNavigationDevices() {
  const response = await api.get("/devices/navigation");
  return response.data;
}

export async function getDevice(deviceId) {
  const response = await api.get(`/devices/${deviceId}`);
  return response.data;
}

export async function createDevice(values) {
  const response = await api.post("/devices", values);
  return response.data;
}

export async function updateDevice(deviceId, values) {
  const response = await api.patch(`/devices/${deviceId}`, values);
  return response.data;
}

export async function deactivateDevice(deviceId) {
  const response = await api.delete(`/devices/${deviceId}`);
  return response.data;
}
