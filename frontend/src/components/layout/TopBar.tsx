import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import TabNav from "./TabNav";
import { LogOut, Zap, Moon, Sun } from "lucide-react";
import * as s from "./TopBar.css";

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggle } = useTheme();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <div className={s.brand} style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          <Zap size={24} color="#38A169" />
          <span className={s.brandName}>Ground Zero</span>
        </div>

        <TabNav />

        <div className={s.right}>
          {user && (
            <span className={s.studentName}>{user.full_name}</span>
          )}
          <button onClick={toggle} className={s.themeBtn} title="Toggle theme">
            {mode === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className={s.iconBtn}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
