import api from "./api";
export async function getCompanyProfile() {
  const response = await api.get("/company/profile");
  return response.data;
}
export async function updateCompanyProfile(values) {
  const response = await api.patch("/company/profile", values);
  return response.data;
}
