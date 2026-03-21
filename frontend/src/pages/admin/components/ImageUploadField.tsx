import React, { useState } from "react";
import { api } from "@/api/client";
import type { InputField } from "@/api/types/admin";
import * as s from "../admin.css";

interface Props {
  field: InputField;
  value: unknown;
  onChange: (v: unknown) => void;
}

export default function ImageUploadField({ field, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const url = typeof value === "string" ? value : "";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { data } = await api.post("/admin/media/presigned-upload", { file_name: file.name, content_type: file.type });
      const uploadRes = await fetch(data.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error(`s3 ${uploadRes.status}`);
      onChange(data.public_url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div className={s.label}>
        {field.label} {field.required && <span style={{ color: "#E53E3E" }}>*</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={handleFile} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{ padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}
        >
          {uploading ? "Uploading..." : url ? "Replace" : "↑ Upload Image"}
        </button>
        {error && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
      </div>
      {url && <img src={url} alt="preview" style={{ marginTop: 8, maxHeight: 120, maxWidth: "100%", borderRadius: 8, border: "1px solid #e2e8f0", objectFit: "contain" }} />}
    </div>
  );
}
