import { useState } from "react";
import { useQuestionTemplates, useUpdateQuestionTemplate } from "@/api/hooks/useAdmin";
import type { QuestionTemplate } from "@/api/types/admin";
import { Check, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import TemplatePreview from "./TemplatePreview";
import * as s from "./admin.css";

export default function QuestionTemplatesPage() {
  const { data: templates, isLoading } = useQuestionTemplates();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const updateMutation = useUpdateQuestionTemplate();

  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.emptyState}>Loading templates...</div>
      </div>
    );
  }

  const handleSavePrompt = (id: string) => {
    updateMutation.mutate(
      { id, llm_prompt_template: editPrompt },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Question Templates</h1>
          <p className={s.subtitle}>
            {templates?.length ?? 0} interaction patterns for activity questions
          </p>
        </div>
      </div>

      <div className={s.grid}>
        {templates?.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            isExpanded={expandedId === t.id}
            isEditing={editingId === t.id}
            editPrompt={editPrompt}
            onToggle={() =>
              setExpandedId(expandedId === t.id ? null : t.id)
            }
            onEditPrompt={() => {
              setEditingId(t.id);
              setEditPrompt(t.llm_prompt_template);
            }}
            onCancelEdit={() => setEditingId(null)}
            onSavePrompt={() => handleSavePrompt(t.id)}
            onEditPromptChange={setEditPrompt}
            isSaving={updateMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template: t,
  isExpanded,
  isEditing,
  editPrompt,
  onToggle,
  onEditPrompt,
  onCancelEdit,
  onSavePrompt,
  onEditPromptChange,
  isSaving,
}: {
  template: QuestionTemplate;
  isExpanded: boolean;
  isEditing: boolean;
  editPrompt: string;
  onToggle: () => void;
  onEditPrompt: () => void;
  onCancelEdit: () => void;
  onSavePrompt: () => void;
  onEditPromptChange: (v: string) => void;
  isSaving: boolean;
}) {
  return (
    <div
      className={s.card}
      onClick={isExpanded ? undefined : onToggle}
      style={{ gridColumn: isExpanded ? "1 / -1" : undefined }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
        onClick={isExpanded ? onToggle : undefined}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 28 }}>{t.icon}</span>
          <div>
            <div className={s.cardTitle}>{t.name}</div>
            <div className={s.cardMeta}>
              <span>{t.frontend_component}</span>
              {t.scorable ? (
                <span className={`${s.badge} ${s.badgeSuccess}`}>
                  <Check size={10} style={{ marginRight: 3 }} /> Scorable
                </span>
              ) : (
                <span className={`${s.badge} ${s.badgeWarning}`}>
                  <X size={10} style={{ marginRight: 3 }} /> Unscored
                </span>
              )}
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      <p className={s.cardDesc}>{t.description}</p>

      {isExpanded && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label className={s.label}>Student UI Preview</label>
            <TemplatePreview slug={t.slug} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className={s.label}>Example Use Cases</label>
            <p className={s.cardDesc}>{t.example_use_cases}</p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className={s.label}>Input Fields (Admin fills these)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {t.input_schema.fields?.map((f) => (
                <div
                  key={f.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    padding: "6px 10px",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-inset, #f5f5f5)",
                  }}
                >
                  <code style={{ fontWeight: 600, minWidth: 100 }}>{f.key}</code>
                  <span style={{ opacity: 0.6 }}>{f.type}</span>
                  <span style={{ flex: 1 }}>{f.label}</span>
                  {f.required && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-feedback-danger, #E53E3E)" }}>
                      required
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className={s.label}>
                <Sparkles size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                LLM Prompt Template
              </label>
              {!isEditing && (
                <button className={s.editBtn} onClick={onEditPrompt}>
                  Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <div>
                <textarea
                  className={s.textarea}
                  value={editPrompt}
                  onChange={(e) => onEditPromptChange(e.target.value)}
                  rows={4}
                />
                <div className={s.formActions}>
                  <button className={s.cancelBtn} onClick={onCancelEdit}>
                    Cancel
                  </button>
                  <button
                    className={s.submitBtn}
                    onClick={onSavePrompt}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <pre
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-inset, #f5f5f5)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                }}
              >
                {t.llm_prompt_template}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
