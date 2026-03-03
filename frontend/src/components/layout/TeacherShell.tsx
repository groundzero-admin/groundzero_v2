import { Outlet } from "react-router";
import { TeacherProvider } from "@/context/TeacherContext";
import TeacherTopBar from "./TeacherTopBar";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import * as s from "./TeacherShell.css";

export default function TeacherShell() {
  return (
    <TeacherProvider>
      <div className={s.layout}>
        <TeacherTopBar />
        <div className={s.body}>
          <TeacherSidebar />
          <main className={s.main}>
            <Outlet />
          </main>
        </div>
      </div>
    </TeacherProvider>
  );
}
