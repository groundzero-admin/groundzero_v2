import { NavLink } from "react-router";
import { LayoutDashboard, Radio, Home } from "lucide-react";
import * as s from "./TabNav.css";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live", label: "Live", icon: Radio },
];

export default function TabNav() {
  return (
    <nav className={s.nav}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [s.link, isActive && s.linkActive].filter(Boolean).join(" ")
          }
        >
          <tab.icon size={16} />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
