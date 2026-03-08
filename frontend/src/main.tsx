import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HMSRoomProvider } from "@100mslive/react-sdk";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HMSRoomProvider>
      <App />
    </HMSRoomProvider>
  </StrictMode>
);
