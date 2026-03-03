import { Outlet } from "react-router";
import TopBar from "./TopBar";
import * as s from "./AppShell.css";

export default function AppShell() {
  return (
    <div className={s.shell}>
      <TopBar />
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
