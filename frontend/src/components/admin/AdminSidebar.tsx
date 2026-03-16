import { useLocation, useNavigate } from "react-router";
import { LayoutTemplate, Rocket, Users, MonitorPlay, Puzzle } from "lucide-react";
import * as s from "./AdminSidebar.css";

const NAV_ITEMS = [
    { label: "Sessions", path: "/teacher", icon: MonitorPlay },
    { label: "Templates", path: "/admin/templates", icon: LayoutTemplate },
    { label: "Question Patterns", path: "/admin/question-templates", icon: Puzzle },
    { label: "Cohorts", path: "/admin/cohorts", icon: Rocket },
    { label: "All Students", path: "/admin/students", icon: Users },
];

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className={s.sidebar}>
            <div className={s.sectionLabel}>Management</div>
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
                <button
                    key={path}
                    className={`${s.navItem} ${location.pathname.startsWith(path) ? s.navItemActive : ""}`}
                    onClick={() => navigate(path)}
                >
                    <Icon size={18} />
                    {label}
                </button>
            ))}
        </aside>
    );
}
