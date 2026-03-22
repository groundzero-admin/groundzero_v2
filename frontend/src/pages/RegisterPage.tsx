import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Zap } from "lucide-react";
import * as s from "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [board, setBoard] = useState("cbse");
  const [grade, setGrade] = useState(6);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive grade_band from grade
  function gradeBand(g: number): string {
    if (g <= 5) return "4-5";
    if (g <= 7) return "6-7";
    return "8-9";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        email,
        password,
        full_name: fullName,
        role,
        ...(role === "student" && {
          board,
          grade,
          grade_band: gradeBand(grade),
        }),
      });
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.brandRow}>
          <Zap size={28} color="#38A169" />
          <h1 className={s.title}>Ground Zero</h1>
        </div>
        <p className={s.subtitle}>Create your account</p>

        <div className={s.card}>
          <form onSubmit={handleSubmit} className={s.form}>
            {error && <div className={s.error}>{error}</div>}

            <div className={s.fieldGroup}>
              <label htmlFor="fullName" className={s.label}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                className={s.input}
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className={s.fieldGroup}>
              <label htmlFor="reg-email" className={s.label}>
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                className={s.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={s.fieldGroup}>
              <label htmlFor="reg-password" className={s.label}>
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                className={s.input}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className={s.fieldGroup}>
              <label htmlFor="role" className={s.label}>
                I am a...
              </label>
              <select
                id="role"
                className={s.select}
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "student" | "teacher")
                }
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {role === "student" && (
              <div className={s.row}>
                <div className={s.fieldGroup} style={{ flex: 1 }}>
                  <label htmlFor="board" className={s.label}>
                    Board
                  </label>
                  <select
                    id="board"
                    className={s.select}
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                  >
                    <option value="cbse">CBSE</option>
                    <option value="icse">ICSE</option>
                    <option value="ib">IB</option>
                  </select>
                </div>
                <div className={s.fieldGroup} style={{ flex: 1 }}>
                  <label htmlFor="grade" className={s.label}>
                    Grade
                  </label>
                  <select
                    id="grade"
                    className={s.select}
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                  >
                    {[4, 5, 6, 7, 8, 9].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={s.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className={s.footer}>
          Already have an account?{" "}
          <Link to="/login" className={s.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
