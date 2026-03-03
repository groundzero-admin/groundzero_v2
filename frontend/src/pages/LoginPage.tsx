import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Zap } from "lucide-react";
import * as s from "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // AuthContext sets user → RequireAuth will redirect based on role
      // For now, navigate to role-appropriate home
      navigate("/home", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Login failed. Check your credentials.";
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
        <p className={s.subtitle}>Sign in to your account</p>

        <div className={s.card}>
          <form onSubmit={handleSubmit} className={s.form}>
            {error && <div className={s.error}>{error}</div>}

            <div className={s.fieldGroup}>
              <label htmlFor="email" className={s.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                className={s.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className={s.fieldGroup}>
              <label htmlFor="password" className={s.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={s.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              className={s.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className={s.footer}>
          Don&apos;t have an account?{" "}
          <Link to="/register" className={s.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
