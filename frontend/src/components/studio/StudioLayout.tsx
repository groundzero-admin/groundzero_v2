import { Outlet } from "react-router";
import { StudioThemeProvider } from "@/context/StudioThemeContext";

export default function StudioLayout() {
  return (
    <StudioThemeProvider>
      <Outlet />
    </StudioThemeProvider>
  );
}
