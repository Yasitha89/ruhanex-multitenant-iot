import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css";

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { DeviceProvider } from "./devices/DeviceContext";
import "./styles/global.css";
import { CompanyProvider } from "./company/CompanyContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#0c5d8c",
            borderRadius: 10,
          },
        }}
      >
        <AuthProvider>
          <CompanyProvider>
            <DeviceProvider>
              <App />
            </DeviceProvider>
          </CompanyProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
