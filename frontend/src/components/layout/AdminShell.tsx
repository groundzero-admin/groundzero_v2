import { Outlet } from "react-router";
import AdminTopBar from "./AdminTopBar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import * as s from "./AdminShell.css";

export default function AdminShell() {
    return (
        <div className={s.layout}>
            <AdminTopBar />
            <div className={s.body}>
                <AdminSidebar />
                <main className={s.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
