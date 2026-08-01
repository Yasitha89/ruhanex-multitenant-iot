import api from "./api";

export async function getSites() {
  const response = await api.get("/sites");
  return response.data;
}

export async function createSite(values) {
  const response = await api.post("/sites", values);
  return response.data;
}

export async function updateSite(siteId, values) {
  const response = await api.patch(`/sites/${siteId}`, values);
  return response.data;
}

export async function deleteSite(siteId) {
  const response = await api.delete(`/sites/${siteId}`);
  return response.data;
}
