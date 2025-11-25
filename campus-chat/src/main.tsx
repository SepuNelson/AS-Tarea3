import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { AppProviders } from "./app/providers";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
