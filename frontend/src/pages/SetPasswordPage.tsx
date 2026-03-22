import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/api/client";
import { Loader2 } from "lucide-react";
import * as s from "./LoginPage.css";

interface InviteInfo {
  email: string;
  full_name: string;
}

export default function SetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { acceptInvite } = useAuth();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    api
      .get<InviteInfo>(`/auth/invite/${token}`)
      .then(({ data }) => {
        setInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setInvalid(true);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite(token!, password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Something went wrong. The link may have expired."
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={s.page}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (invalid || !info) {
    return (
      <div className={s.page}>
        <div className={s.container}>
          <div className={s.brandRow}>
            <span className={s.title}>GroundZero</span>
          </div>
          <p className={s.subtitle}>
            This invite link is invalid or has expired. Please contact your administrator
            for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.container}>
        <div className={s.brandRow}>
          <span className={s.title}>GroundZero</span>
        </div>
        <p className={s.subtitle}>
          Welcome, {info.full_name}! Set your password to get started.
        </p>

        <div className={s.card}>
          <form className={s.form} onSubmit={handleSubmit}>
            <div className={s.fieldGroup}>
              <label className={s.label}>Email</label>
              <input
                className={s.input}
                type="email"
                value={info.email}
                disabled
              />
            </div>

            <div className={s.fieldGroup}>
              <label className={s.label}>Password</label>
              <input
                className={s.input}
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                minLength={8}
              />
            </div>

            <div className={s.fieldGroup}>
              <label className={s.label}>Confirm Password</label>
              <input
                className={s.input}
                type="password"
                placeholder="Type your password again"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className={s.error}>{error}</div>}

            <button
              className={s.submitBtn}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Setting up..." : "Set Password & Start"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
