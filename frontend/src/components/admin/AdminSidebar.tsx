import { useLocation, useNavigate } from "react-router";
import { LayoutTemplate, Rocket, Users, MonitorPlay, Blocks, BookOpen, Video } from "lucide-react";
import * as s from "./AdminSidebar.css";

const NAV_ITEMS = [
    { label: "Teacher View", path: "/teacher", icon: MonitorPlay },
    { label: "Templates", path: "/admin/templates", icon: LayoutTemplate },
    { label: "Activities", path: "/admin/activities", icon: Blocks },
    { label: "Question Bank", path: "/admin/question-bank", icon: BookOpen },
    { label: "Cohorts", path: "/admin/cohorts", icon: Rocket },
    { label: "All Students", path: "/admin/students", icon: Users },
    { label: "Class Recordings", path: "/admin/class-recordings", icon: Video },
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
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                const activeClass =
                    label === "Question Bank"
                        ? (isQuestionBankActive ? s.navItemActive : "")
                        : label === "Teacher View"
                            ? (pathname.startsWith("/teacher") ? s.navItemActive : "")
                            : (pathname.startsWith(path) ? s.navItemActive : "");

                if (path === "/teacher") {
                    return (
                        <a
                            key={path}
                            href={path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${s.navItemLink} ${activeClass}`}
                        >
                            <Icon size={18} />
                            {label}
                        </a>
                    );
                }

                return (
                    <button
                        key={path}
                        type="button"
                        className={`${s.navItem} ${activeClass}`}
                        onClick={() => navigate(path)}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                );
            })}
        </aside>
    );
}
