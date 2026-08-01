import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getNavigationDevices } from "../api/deviceApi";
import { useAuth } from "../auth/AuthContext";

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const { isAuthenticated, tenant } = useAuth();
  const [navigationDevices, setNavigationDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState("");

  const refreshNavigationDevices = useCallback(async () => {
    if (!isAuthenticated) {
      setNavigationDevices([]);
      return;
    }

    setLoadingDevices(true);
    setDeviceError("");

    try {
      const result = await getNavigationDevices();
      setNavigationDevices(
        Array.isArray(result.devices) ? result.devices : []
      );
    } catch (error) {
      setNavigationDevices([]);
      setDeviceError(error.message || "Unable to load devices");
    } finally {
      setLoadingDevices(false);
    }
  }, [isAuthenticated, tenant?.id]);

  useEffect(() => {
    refreshNavigationDevices();
  }, [refreshNavigationDevices]);

  const value = useMemo(
    () => ({
      navigationDevices,
      loadingDevices,
      deviceError,
      refreshNavigationDevices,
    }),
    [
      navigationDevices,
      loadingDevices,
      deviceError,
      refreshNavigationDevices,
    ]
  );

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error("useDevices must be used inside DeviceProvider");
  }

  return context;
}
