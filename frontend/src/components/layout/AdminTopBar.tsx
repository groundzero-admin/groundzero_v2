import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LogOut, Zap, Moon, Sun } from "lucide-react";
import * as s from "./TeacherTopBar.css"; // reuse same topbar styles

export default function AdminTopBar() {
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
                <div className={s.brand} onClick={() => navigate("/admin")}>
                    <Zap size={24} color="#38A169" />
                    <span className={s.brandName}>Ground Zero</span>
                    <span className={s.badge}>Admin</span>
                </div>

                <div className={s.right}>
                    {user && <span className={s.userName}>{user.full_name}</span>}
                    <button onClick={toggle} className={s.iconBtn} title="Toggle theme">
                        {mode === "light" ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    <button onClick={handleLogout} className={s.iconBtn} title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
