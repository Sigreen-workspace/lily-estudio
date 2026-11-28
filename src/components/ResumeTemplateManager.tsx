"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BuiltInTemplateStyle,
  ResumeTemplateRecord,
} from "@/types/resume";
import {
  Plus,
  Upload,
  Pencil,
  Trash2,
  X,
  Check,
  ShieldCheck,
} from "lucide-react";

interface ResumeTemplateManagerProps {
  userId: string;
  role: string;
  customTemplates: ResumeTemplateRecord[];
  onTemplatesChanged: () => Promise<void> | void;
}

interface TemplateFormState {
  id?: string;
  name: string;
  tag: string;
  description: string;
  layout_style: BuiltInTemplateStyle;
  custom_html: string;
  is_active: boolean;
}

const EMPTY_FORM: TemplateFormState = {
  name: "",
  tag: "Faculty / Placement",
  description: "",
  layout_style: "classic_ats",
  custom_html: "",
  is_active: true,
};

function formatSupabaseError(err: unknown): string {
  if (!err || typeof err !== "object") return String(err || "Unknown error");
  const e = err as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  return [e.code, e.message, e.details, e.hint].filter(Boolean).join(" — ") ||
    "Database error (check table columns and RLS policies).";
}

export default function ResumeTemplateManager({
  userId,
  role,
  customTemplates,
  onTemplatesChanged,
}: ResumeTemplateManagerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (role !== "admin" && role !== "teacher") {
    return null;
  }

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setStatusMsg(null);
    setDrawerOpen(true);
  };

  const openEdit = (tpl: ResumeTemplateRecord) => {
    setForm({
      id: tpl.id,
      name: tpl.name,
      tag: tpl.tag,
      description: tpl.description,
      layout_style: tpl.layout_style,
      custom_html: tpl.custom_html || "",
      is_active: tpl.is_active ?? true,
    });
    setStatusMsg(null);
    setDrawerOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    if (file.name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(text) as {
          name?: string;
          tag?: string;
          description?: string;
          layout_style?: BuiltInTemplateStyle;
          custom_html?: string;
        };
        setForm((prev) => ({
          ...prev,
          name: parsed.name || file.name.replace(/\.json$/i, ""),
          tag: parsed.tag || prev.tag,
          description: parsed.description || prev.description,
          layout_style: parsed.layout_style || prev.layout_style,
          custom_html: parsed.custom_html || prev.custom_html,
        }));
        setStatusMsg(`Loaded JSON template "${file.name}". Click Save Template to publish.`);
      } catch {
        setStatusMsg("Invalid JSON file format.");
      }
    } else {
      setForm((prev) => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^.]+$/, ""),
        tag: "Uploaded Template",
        custom_html: text,
      }));
      setStatusMsg(`Loaded "${file.name}". Click Save Template to publish.`);
    }

    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setStatusMsg("Template name is required.");
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const payload = {
        name: form.name.trim(),
        tag: form.tag.trim() || "Custom",
        description: form.description.trim(),
        layout_style: form.layout_style,
        custom_html: form.custom_html.trim() || null,
        is_active: form.is_active,
        created_by: userId,
        created_by_role: role,
      };

      if (form.id) {
        const { error } = await supabase
          .from("resume_templates")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("resume_templates")
          .insert(payload);
        if (error) throw error;
      }

      await onTemplatesChanged();
      setDrawerOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      const details = formatSupabaseError(err);
      console.error("Error saving template:", details);
      setStatusMsg(`Could not save template: ${details}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this custom resume template?")) return;
    const { error } = await supabase
      .from("resume_templates")
      .delete()
      .eq("id", id);
    if (error) {
      const details = formatSupabaseError(error);
      console.error("Error deleting template:", details);
      setStatusMsg(`Could not delete template: ${details}`);
      return;
    }
    await onTemplatesChanged();
  };

  return (
    <div className="no-print bg-white rounded-3xl border border-[#74B49B]/40 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#427563]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{role === "admin" ? "Admin" : "Teacher"} Template Studio</span>
          </div>
          <h2 className="text-sm font-extrabold text-slate-800">
            Create, Edit &amp; Upload Resume Templates ({customTemplates.length} Custom)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#5C899D]" />
            <span>Upload .JSON / .HTML</span>
            <input
              type="file"
              accept=".json,.html,.htm,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#5C899D] hover:bg-[#4a7285] rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        </div>
      </div>

      {/* Existing Custom Templates Quick Manage Bar */}
      {customTemplates.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {customTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <span className="font-bold text-slate-800">{tpl.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
                {tpl.tag}
              </span>
              <button
                type="button"
                onClick={() => openEdit(tpl)}
                className="p-1 text-slate-500 hover:text-[#5C899D] cursor-pointer"
                title="Edit template"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(tpl.id)}
                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                title="Delete template"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800">
                {form.id ? "Edit Resume Template" : "Create New Resume Template"}
              </h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusMsg && (
              <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                {statusMsg}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Core Engineering CV"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Badge / Category</label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="e.g. Placement / GATE"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Base Layout Style</label>
                <select
                  value={form.layout_style}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      layout_style: e.target.value as BuiltInTemplateStyle,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="classic_ats">Classic ATS</option>
                  <option value="modern_tech">Modern Tech</option>
                  <option value="minimalist">Minimalist Academic</option>
                  <option value="compact_one_page">Compact 1-Page</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Visible to students
                </label>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short note on when students should use this template"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-600 mb-1">
                Optional Custom HTML Markup (supports {"{{fullName}}"}, {"{{headline}}"}, {"{{email}}"}, {"{{summary}}"}, {"{{skills}}"})
              </label>
              <textarea
                rows={4}
                value={form.custom_html}
                onChange={(e) => setForm({ ...form, custom_html: e.target.value })}
                placeholder="Leave blank to use the structured layout style above, or paste custom HTML..."
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#74B49B] hover:bg-[#5f9c85] rounded-xl cursor-pointer disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}