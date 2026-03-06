import { useLocation, useNavigate } from "react-router";
import { LayoutTemplate, Rocket, Users } from "lucide-react";
import * as s from "./AdminSidebar.css";

const NAV_ITEMS = [
    { label: "Template Cohorts", path: "/admin/templates", icon: LayoutTemplate },
    { label: "Launch Batches", path: "/admin/batches", icon: Rocket },
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
