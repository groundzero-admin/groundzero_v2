import { useLocation, useNavigate } from "react-router";
import { LayoutTemplate, Rocket, Users, MonitorPlay, Blocks, BookOpen } from "lucide-react";
import * as s from "./AdminSidebar.css";

const NAV_ITEMS = [
    { label: "Teacher View", path: "/teacher", icon: MonitorPlay },
    { label: "Templates", path: "/admin/templates", icon: LayoutTemplate },
    { label: "Activities", path: "/admin/activities", icon: Blocks },
    { label: "Question Bank", path: "/admin/question-bank", icon: BookOpen },
    { label: "Cohorts", path: "/admin/cohorts", icon: Rocket },
    { label: "All Students", path: "/admin/students", icon: Users },
];

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;

    const isQuestionBankActive =
        pathname.startsWith("/admin/question-bank") || pathname.startsWith("/admin/create-question");

    return (
        <aside className={s.sidebar}>
            <div className={s.sectionLabel}>Management</div>
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
                <button
                    key={path}
                    className={`${s.navItem} ${
                        label === "Question Bank"
                            ? (isQuestionBankActive ? s.navItemActive : "")
                            : label === "Teacher View"
                                ? (pathname.startsWith("/teacher") ? s.navItemActive : "")
                                : (pathname.startsWith(path) ? s.navItemActive : "")
                    }`}
                    onClick={() => navigate(path)}
                >
                    <Icon size={18} />
                    {label}
                </button>
            ))}
        </aside>
    );
}
