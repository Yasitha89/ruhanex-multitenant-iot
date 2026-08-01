import axios from "axios";

function getClient() {
  const baseURL = String(process.env.NODE_RED_BASE_URL || "").replace(/\/+$/, "");
  const apiKey = String(process.env.NODE_RED_INTERNAL_API_KEY || "").trim();

  if (!baseURL) throw new Error("NODE_RED_BASE_URL is not configured");
  if (!apiKey) throw new Error("NODE_RED_INTERNAL_API_KEY is not configured");

  return axios.create({
    baseURL,
    timeout: Number(process.env.NODE_RED_TIMEOUT_MS || 15000),
    headers: {
      "X-Internal-Api-Key": apiKey,
      Accept: "application/json",
    },
  });
}

export async function getProductionDashboardFromNodeRed(params) {
  try {
    const response = await getClient().get("/api/iot/device-dashboard", { params });

    if (!response.data?.success) {
      const error = new Error(response.data?.error || "Node-RED returned an unsuccessful response");
      error.statusCode = 502;
      throw error;
    }

    return response.data;
  } catch (error) {
    if (error.statusCode) throw error;

    const upstreamStatus = error.response?.status || 502;
    const message =
      error.response?.data?.error ||
      (error.code === "ECONNABORTED" ? "Node-RED request timed out" : error.message) ||
      "Node-RED request failed";

    const serviceError = new Error(message);
    serviceError.statusCode =
      upstreamStatus === 401 || upstreamStatus === 403 ? 502 : upstreamStatus;
    throw serviceError;
  }
}
