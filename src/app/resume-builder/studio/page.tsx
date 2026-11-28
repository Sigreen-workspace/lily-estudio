"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  BuiltInTemplateStyle,
  DEFAULT_TEMPLATE_STYLE,
  ResumeData,
  ResumeTemplateRecord,
  TemplateDensity,
  TemplateFontFamily,
  TemplateHeaderStyle,
  TemplateStyleConfig,
  TemplateTextSize,
  TextElementStyle,
  TextTone,
} from "@/types/resume";
import {
  ArrowLeft,
  Save,
  Upload,
  Palette,
  Type,
  Sliders,
  Eye,
  CheckCircle2,
  AlertCircle,
  Table2,
} from "lucide-react";

type EditableTextTarget =
  | "nameStyle"
  | "headlineStyle"
  | "sectionHeadingStyle"
  | "bodyStyle";

const COLOR_PRESETS = [
  { label: "Sage Emerald", accent: "#427563", heading: "#0f172a", border: "#cbd5e1", banner: "#0f172a" },
  { label: "Slate Teal", accent: "#0f766e", heading: "#0f172a", border: "#99f6e4", banner: "#134e4a" },
  { label: "Steel Blue", accent: "#1d4ed8", heading: "#1e293b", border: "#bfdbfe", banner: "#1e3a8a" },
  { label: "Charcoal Ink", accent: "#1e293b", heading: "#09090b", border: "#d4d4d8", banner: "#18181b" },
  { label: "Burgundy Academic", accent: "#881337", heading: "#18181b", border: "#fecdd3", banner: "#4c0519" },
];

const SAMPLE_PREVIEW_DATA: ResumeData = {
  fullName: "Candidate Name",
  headline: "Degree Program • Core Specialization",
  email: "your.email@example.com",
  phone: "+00 00000 00000",
  location: "City, Country",
  linkedin: "linkedin.com/in/your-profile",
  github: "github.com/your-username",
  summary:
    "Concise professional or academic summary highlighting core strengths, technical skills, and key areas of focus.",
  skills: "Skill One, Skill Two, Skill Three, Skill Four, Skill Five, Skill Six",
  education: [
    {
      id: "e1",
      degree: "Bachelor's / Master's Degree",
      institution: "University / Institute Name",
      year: "YYYY – YYYY",
      grade: "Score / GPA",
    },
    {
      id: "e2",
      degree: "Higher Secondary Qualification",
      institution: "Secondary School Name",
      year: "YYYY – YYYY",
      grade: "Percentage / Grade",
    },
  ],
  experience: [
    {
      id: "x1",
      role: "Role / Position Title",
      organization: "Organization Name",
      duration: "Month YYYY – Month YYYY",
      bullets:
        "Key responsibility or measurable outcome achieved during the role.\nTechnical contribution, documentation, or project delivery highlight.",
    },
  ],
  projects: [
    {
      id: "p1",
      title: "Project Title",
      techStack: "Tools, Frameworks & Technologies",
      link: "github.com/your-username/repository",
      description:
        "Brief overview of the problem solved, system architecture, and final impact.",
    },
  ],
  customSections: [
    {
      id: "c1",
      heading: "Languages",
      content: "Language One (Fluent), Language Two (Proficient)",
    },
    {
      id: "c2",
      heading: "Certifications",
      content: "Certification Title One\nCertification Title Two",
    },
  ],
};

function mergeStyleConfig(
  raw?: Partial<TemplateStyleConfig> | null
): TemplateStyleConfig {
  return {
    ...DEFAULT_TEMPLATE_STYLE,
    ...(raw || {}),
    nameStyle: {
      ...DEFAULT_TEMPLATE_STYLE.nameStyle,
      ...(raw?.nameStyle || {}),
    },
    headlineStyle: {
      ...DEFAULT_TEMPLATE_STYLE.headlineStyle,
      ...(raw?.headlineStyle || {}),
    },
    sectionHeadingStyle: {
      ...DEFAULT_TEMPLATE_STYLE.sectionHeadingStyle,
      ...(raw?.sectionHeadingStyle || {}),
    },
    bodyStyle: {
      ...DEFAULT_TEMPLATE_STYLE.bodyStyle,
      ...(raw?.bodyStyle || {}),
    },
  };
}

function formatDbError(err: unknown): string {
  if (!err || typeof err !== "object") return String(err || "Unknown error");
  const e = err as { code?: string; message?: string; details?: string; hint?: string };
  return (
    [e.code, e.message, e.details, e.hint].filter(Boolean).join(" — ") ||
    "Database error. Check resume_templates table and RLS policy."
  );
}

function getFontCssFamily(fontFamily: TemplateFontFamily): string {
  switch (fontFamily) {
    case "serif":
      return "Georgia, Cambria, 'Times New Roman', Times, serif";
    case "times":
      return "'Times New Roman', Times, Georgia, serif";
    case "arial":
      return "Arial, Helvetica, sans-serif";
    case "mono":
      return "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
    case "sans":
    default:
      return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }
}

function getElementTextStyle(
  el: TextElementStyle,
  options?: { fallbackBold?: boolean; forceColor?: string }
): React.CSSProperties {
  return {
    color: options?.forceColor ?? el.color,
    fontSize: `${el.fontSizePx}px`,
    fontFamily: getFontCssFamily(el.fontFamily),
    fontWeight: el.bold ? 800 : options?.fallbackBold ? 600 : 400,
  };
}

export default function TemplateStudioPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <Suspense fallback={<div className="p-10 text-xs text-slate-500">Loading Template Studio...</div>}>
        <TemplateStudioContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function TemplateStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const { user, profile } = useAuth();

  const [name, setName] = useState("");
  const [tag, setTag] = useState("Placement / Academic");
  const [description, setDescription] = useState("");
  const [layoutStyle, setLayoutStyle] = useState<BuiltInTemplateStyle>("classic_ats");
  const [customHtml, setCustomHtml] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [styleConfig, setStyleConfig] = useState<TemplateStyleConfig>(DEFAULT_TEMPLATE_STYLE);
  const [activeTextTarget, setActiveTextTarget] =
    useState<EditableTextTarget>("nameStyle");

  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(editId));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    let ignore = false;

    async function loadTemplateForEdit() {
      setLoadingExisting(true);
      try {
        const { data, error } = await supabase
          .from("resume_templates")
          .select("*")
          .eq("id", editId)
          .maybeSingle();

        if (!ignore && !error && data) {
          const tpl = data as ResumeTemplateRecord;
          setName(tpl.name || "");
          setTag(tpl.tag || "Custom");
          setDescription(tpl.description || "");
          setLayoutStyle(tpl.layout_style || "classic_ats");
          setCustomHtml(tpl.custom_html || "");
          setIsActive(tpl.is_active ?? true);
          setStyleConfig(mergeStyleConfig(tpl.style_config));
        }
      } finally {
        if (!ignore) setLoadingExisting(false);
      }
    }

    void loadTemplateForEdit();
    return () => {
      ignore = true;
    };
  }, [editId]);

  const updateStyle = <K extends keyof TemplateStyleConfig>(
    key: K,
    value: TemplateStyleConfig[K]
  ) => {
    setStyleConfig((prev) => ({ ...prev, [key]: value }));
  };

  const currentElStyle = styleConfig[activeTextTarget];

  const updateTextElement = <K extends keyof TextElementStyle>(
    field: K,
    value: TextElementStyle[K]
  ) => {
    setStyleConfig((prev) => ({
      ...prev,
      [activeTextTarget]: {
        ...prev[activeTextTarget],
        [field]: value,
      },
    }));
  };

  const handleSetTone = (tone: TextTone) => {
    setStyleConfig((prev) => ({
      ...prev,
      [activeTextTarget]: {
        ...prev[activeTextTarget],
        tone,
        color: tone === "light" ? "#f8fafc" : "#0f172a",
      },
    }));
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
          style_config?: Partial<TemplateStyleConfig>;
        };
        if (parsed.name) setName(parsed.name);
        if (parsed.tag) setTag(parsed.tag);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.layout_style) setLayoutStyle(parsed.layout_style);
        if (parsed.custom_html) setCustomHtml(parsed.custom_html);
        if (parsed.style_config) {
          setStyleConfig((prev) => mergeStyleConfig({ ...prev, ...parsed.style_config }));
        }
        setSuccessMsg(`Imported "${file.name}". Review and click Save Template.`);
        setErrorMsg(null);
      } catch {
        setErrorMsg("Could not parse JSON template file.");
      }
    } else {
      if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ""));
      setCustomHtml(text);
      setSuccessMsg(`Loaded HTML markup from "${file.name}".`);
      setErrorMsg(null);
    }

    e.target.value = "";
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setErrorMsg("Please enter a template name.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        name: name.trim(),
        tag: tag.trim() || "Custom",
        description: description.trim(),
        layout_style: layoutStyle,
        style_config: styleConfig,
        custom_html: customHtml.trim() || null,
        is_active: isActive,
        created_by: user.id,
        created_by_role: profile?.role || "teacher",
      };

      const query = editId
        ? supabase.from("resume_templates").update(payload).eq("id", editId)
        : supabase.from("resume_templates").insert(payload);

      const { error } = await query;
      if (error) throw error;

      setSuccessMsg("Template saved! Redirecting to Resume Builder...");
      window.setTimeout(() => {
        router.push("/resume-builder");
      }, 700);
    } catch (err) {
      const formatted = formatDbError(err);
      console.error("Template studio save error:", formatted);
      setErrorMsg(formatted);
    } finally {
      setSaving(false);
    }
  };

  const bodyTextClass =
    styleConfig.textSize === "xs"
      ? "text-[10.5px]"
      : styleConfig.textSize === "md"
      ? "text-[13px]"
      : "text-xs";

  const spacingClass =
    styleConfig.density === "compact"
      ? "p-6 leading-snug space-y-2.5"
      : styleConfig.density === "spacious"
      ? "p-10 leading-loose space-y-5"
      : "p-8 leading-relaxed space-y-4";

  const isBannerHeader = styleConfig.headerStyle === "banner";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Studio Top Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Resume Builder
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-800">
            {editId ? "Edit Resume Template" : "Create New Resume Template"}
          </h1>
          <p className="text-xs text-slate-500">
            Customize colors, fonts, text sizes, table grids, individual text styles, and sections with live A4 preview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#5C899D]" />
            <span>Import .JSON / .HTML</span>
            <input
              type="file"
              accept=".json,.html,.htm,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            type="button"
            disabled={saving || loadingExisting}
            onClick={(e) => void handleSaveTemplate(e)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#74B49B] hover:bg-[#5f9c85] rounded-xl transition cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Template"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Save Failed</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <form onSubmit={handleSaveTemplate} className="xl:col-span-5 space-y-5">
          {/* Basic Details */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-800">1. Template Identity &amp; Layout</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Core Placement CV"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. Placement / Academic"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When should students pick this template?"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Base Layout</label>
                <select
                  value={layoutStyle}
                  onChange={(e) => setLayoutStyle(e.target.value as BuiltInTemplateStyle)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="classic_ats">Classic ATS</option>
                  <option value="modern_tech">Modern Tech</option>
                  <option value="minimalist">Minimalist Academic</option>
                  <option value="compact_one_page">Compact 1-Page</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Header Style</label>
                <select
                  value={styleConfig.headerStyle}
                  onChange={(e) =>
                    updateStyle("headerStyle", e.target.value as TemplateHeaderStyle)
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="underline">Classic Bottom Rule</option>
                  <option value="left_bar">Left Accent Bar</option>
                  <option value="banner">Dark Banner Header</option>
                  <option value="centered">Centered Academic</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={styleConfig.useTables}
                  onChange={(e) => updateStyle("useTables", e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Table2 className="w-3.5 h-3.5 text-[#5C899D]" />
                <span>Use Table Layout (Education &amp; Extra)</span>
              </label>

              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Active for students</span>
              </label>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#74B49B]" /> 2. Colors &amp; Accents
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setStyleConfig((prev) => ({
                      ...prev,
                      accentColor: preset.accent,
                      headingColor: preset.heading,
                      borderColor: preset.border,
                      headerBgColor: preset.banner,
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: preset.accent }}
                  />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Accent</label>
                <input
                  type="color"
                  value={styleConfig.accentColor}
                  onChange={(e) => updateStyle("accentColor", e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Heading</label>
                <input
                  type="color"
                  value={styleConfig.headingColor}
                  onChange={(e) => updateStyle("headingColor", e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Divider</label>
                <input
                  type="color"
                  value={styleConfig.borderColor}
                  onChange={(e) => updateStyle("borderColor", e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Banner BG</label>
                <input
                  type="color"
                  value={styleConfig.headerBgColor}
                  onChange={(e) => updateStyle("headerBgColor", e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Fonts, Text Size & Spacing */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#5C899D]" /> 3. Base Fonts, Size &amp; Spacing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Font Family</label>
                <select
                  value={styleConfig.fontFamily}
                  onChange={(e) =>
                    updateStyle("fontFamily", e.target.value as TemplateFontFamily)
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="sans">System Sans</option>
                  <option value="arial">Arial / Helvetica</option>
                  <option value="serif">Georgia Serif</option>
                  <option value="times">Times New Roman</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Text Size</label>
                <select
                  value={styleConfig.textSize}
                  onChange={(e) => updateStyle("textSize", e.target.value as TemplateTextSize)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="xs">Small (10.5px)</option>
                  <option value="sm">Standard (12px)</option>
                  <option value="md">Large (13px)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Spacing Density</label>
                <select
                  value={styleConfig.density}
                  onChange={(e) => updateStyle("density", e.target.value as TemplateDensity)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>
          </div>

          {/* Individual Text Controls */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-800">
              4. Individual Text Controls (Color, Size, Font, Bold, Dark/Light)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(
                [
                  ["nameStyle", "Name"],
                  ["headlineStyle", "Headline"],
                  ["sectionHeadingStyle", "Section Titles"],
                  ["bodyStyle", "Body Text"],
                ] as const
              ).map(([targetKey, label]) => (
                <button
                  key={targetKey}
                  type="button"
                  onClick={() => setActiveTextTarget(targetKey)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    activeTextTarget === targetKey
                      ? "bg-[#5C899D] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Text Color</label>
                <input
                  type="color"
                  value={currentElStyle.color}
                  onChange={(e) => updateTextElement("color", e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Font Size (px)</label>
                <input
                  type="number"
                  min={9}
                  max={38}
                  value={currentElStyle.fontSizePx}
                  onChange={(e) =>
                    updateTextElement(
                      "fontSizePx",
                      Math.max(9, Math.min(38, Number(e.target.value) || 12))
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Font Family</label>
                <select
                  value={currentElStyle.fontFamily}
                  onChange={(e) =>
                    updateTextElement("fontFamily", e.target.value as TemplateFontFamily)
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="sans">System Sans</option>
                  <option value="arial">Arial / Helvetica</option>
                  <option value="serif">Georgia Serif</option>
                  <option value="times">Times New Roman</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentElStyle.bold}
                  onChange={(e) => updateTextElement("bold", e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Bold Text</span>
              </label>

              <div className="inline-flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Tone:</span>
                <button
                  type="button"
                  onClick={() => handleSetTone("dark")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    currentElStyle.tone === "dark"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTone("light")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                    currentElStyle.tone === "light"
                      ? "bg-white text-slate-900 border-slate-800"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  Light
                </button>
              </div>
            </div>
          </div>

          {/* Sections & Custom HTML */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#74B49B]" /> 5. Sections &amp; Custom Markup
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["showSummary", "Summary"],
                  ["showEducation", "Education"],
                  ["showSkills", "Skills"],
                  ["showExperience", "Experience"],
                  ["showProjects", "Projects"],
                  ["showCustomSections", "Extra Sections"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={styleConfig[key]}
                    onChange={(e) => updateStyle(key, e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <label className="block font-bold text-slate-600 mb-1">
                Optional Custom HTML Override
              </label>
              <textarea
                rows={3}
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                placeholder="Optional HTML using {{fullName}}, {{headline}}, {{email}}, {{summary}}, {{skills}}"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]"
              />
            </div>
          </div>
        </form>

        {/* Right Live Preview */}
        <div className="xl:col-span-7 space-y-3">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#5C899D]" />
              <span>Live Template Preview · {name || "Untitled Template"}</span>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {tag || "Custom"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div
              className={`bg-white mx-auto border border-slate-200 shadow-md text-slate-900 ${bodyTextClass} ${spacingClass}`}
              style={{
                width: "210mm",
                minHeight: "297mm",
                fontFamily: getFontCssFamily(styleConfig.fontFamily),
              }}
            >
              {/* Header */}
              <div
                className={
                  isBannerHeader
                    ? "p-5 rounded-2xl space-y-1.5"
                    : styleConfig.headerStyle === "left_bar"
                    ? "pl-4 py-1 space-y-1"
                    : styleConfig.headerStyle === "centered"
                    ? "pb-4 text-center space-y-1"
                    : "pb-3 space-y-1"
                }
                style={
                  isBannerHeader
                    ? { backgroundColor: styleConfig.headerBgColor }
                    : styleConfig.headerStyle === "left_bar"
                    ? { borderLeft: `4px solid ${styleConfig.accentColor}` }
                    : styleConfig.headerStyle === "centered"
                    ? { borderBottom: `1px solid ${styleConfig.borderColor}` }
                    : { borderBottom: `2px solid ${styleConfig.accentColor}` }
                }
              >
                <h2
                  className="tracking-tight"
                  style={getElementTextStyle(styleConfig.nameStyle, {
                    fallbackBold: true,
                    forceColor:
                      isBannerHeader && styleConfig.nameStyle.tone === "dark"
                        ? "#ffffff"
                        : undefined,
                  })}
                >
                  {SAMPLE_PREVIEW_DATA.fullName}
                </h2>
                <p
                  style={getElementTextStyle(styleConfig.headlineStyle, {
                    fallbackBold: true,
                    forceColor:
                      isBannerHeader && styleConfig.headlineStyle.tone === "dark"
                        ? "#a7f3d0"
                        : undefined,
                  })}
                >
                  {SAMPLE_PREVIEW_DATA.headline}
                </p>
                <div
                  className={`flex flex-wrap gap-x-3 gap-y-1 text-[11px] pt-1 ${
                    isBannerHeader
                      ? "text-slate-200"
                      : styleConfig.headerStyle === "centered"
                      ? "justify-center text-slate-600"
                      : "text-slate-600"
                  }`}
                >
                  <span>{SAMPLE_PREVIEW_DATA.email}</span>
                  <span>• {SAMPLE_PREVIEW_DATA.phone}</span>
                  <span>• {SAMPLE_PREVIEW_DATA.location}</span>
                  <span>• {SAMPLE_PREVIEW_DATA.linkedin}</span>
                </div>
              </div>

              {styleConfig.showSummary && (
                <section className="space-y-1">
                  <h3
                    className="uppercase tracking-wider pb-0.5"
                    style={{
                      ...getElementTextStyle(styleConfig.sectionHeadingStyle, {
                        fallbackBold: true,
                      }),
                      borderBottom: `1px solid ${styleConfig.borderColor}`,
                    }}
                  >
                    Summary
                  </h3>
                  <p style={getElementTextStyle(styleConfig.bodyStyle)}>
                    {SAMPLE_PREVIEW_DATA.summary}
                  </p>
                </section>
              )}

              {styleConfig.showEducation && (
                <section className="space-y-1.5">
                  <h3
                    className="uppercase tracking-wider pb-0.5"
                    style={{
                      ...getElementTextStyle(styleConfig.sectionHeadingStyle, {
                        fallbackBold: true,
                      }),
                      borderBottom: `1px solid ${styleConfig.borderColor}`,
                    }}
                  >
                    Education
                  </h3>

                  {styleConfig.useTables ? (
                    <table
                      className="w-full border-collapse"
                      style={{
                        borderColor: styleConfig.borderColor,
                        ...getElementTextStyle(styleConfig.bodyStyle),
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: `${styleConfig.accentColor}14` }}>
                          <th
                            className="text-left p-2 border font-bold"
                            style={{ borderColor: styleConfig.borderColor }}
                          >
                            Degree / Qualification
                          </th>
                          <th
                            className="text-left p-2 border font-bold"
                            style={{ borderColor: styleConfig.borderColor }}
                          >
                            Institution
                          </th>
                          <th
                            className="text-left p-2 border font-bold"
                            style={{ borderColor: styleConfig.borderColor }}
                          >
                            Year
                          </th>
                          <th
                            className="text-left p-2 border font-bold"
                            style={{ borderColor: styleConfig.borderColor }}
                          >
                            Score / GPA
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {SAMPLE_PREVIEW_DATA.education.map((edu) => (
                          <tr key={edu.id}>
                            <td
                              className="p-2 border font-semibold"
                              style={{ borderColor: styleConfig.borderColor }}
                            >
                              {edu.degree}
                            </td>
                            <td
                              className="p-2 border"
                              style={{ borderColor: styleConfig.borderColor }}
                            >
                              {edu.institution}
                            </td>
                            <td
                              className="p-2 border"
                              style={{ borderColor: styleConfig.borderColor }}
                            >
                              {edu.year}
                            </td>
                            <td
                              className="p-2 border"
                              style={{ borderColor: styleConfig.borderColor }}
                            >
                              {edu.grade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    SAMPLE_PREVIEW_DATA.education.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-start gap-4">
                        <div>
                          <strong
                            className="font-bold block"
                            style={{
                              ...getElementTextStyle(styleConfig.bodyStyle, {
                                fallbackBold: true,
                              }),
                              color: styleConfig.headingColor,
                            }}
                          >
                            {edu.degree}
                          </strong>
                          <span style={getElementTextStyle(styleConfig.bodyStyle)}>
                            {edu.institution}
                          </span>
                        </div>
                        <div className="text-right text-slate-600 shrink-0">
                          <span className="block font-semibold">{edu.year}</span>
                          <span>{edu.grade}</span>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              )}

              {styleConfig.showSkills && (
                <section className="space-y-1">
                  <h3
                    className="uppercase tracking-wider pb-0.5"
                    style={{
                      ...getElementTextStyle(styleConfig.sectionHeadingStyle, {
                        fallbackBold: true,
                      }),
                      borderBottom: `1px solid ${styleConfig.borderColor}`,
                    }}
                  >
                    Skills
                  </h3>
                  <p style={getElementTextStyle(styleConfig.bodyStyle)}>
                    {SAMPLE_PREVIEW_DATA.skills}
                  </p>
                </section>
              )}

              {styleConfig.showExperience && (
                <section className="space-y-1.5">
                  <h3
                    className="uppercase tracking-wider pb-0.5"
                    style={{
                      ...getElementTextStyle(styleConfig.sectionHeadingStyle, {
                        fallbackBold: true,
                      }),
                      borderBottom: `1px solid ${styleConfig.borderColor}`,
                    }}
                  >
                    Experience &amp; Internships
                  </h3>
                  {SAMPLE_PREVIEW_DATA.experience.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-baseline gap-4">
                        <div>
                          <strong
                            className="font-bold"
                            style={{
                              ...getElementTextStyle(styleConfig.bodyStyle, {
                                fallbackBold: true,
                              }),
                              color: styleConfig.headingColor,
                            }}
                          >
                            {exp.role}
                          </strong>
                          <span style={getElementTextStyle(styleConfig.bodyStyle)}>
                            {" "}
                            — {exp.organization}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-600 shrink-0">
                          {exp.duration}
                        </span>
                      </div>
                      <ul
                        className="list-disc pl-4 space-y-0.5"
                        style={getElementTextStyle(styleConfig.bodyStyle)}
                      >
                        {exp.bullets.split("\n").map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {styleConfig.showProjects && (
                <section className="space-y-1.5">
                  <h3
                    className="uppercase tracking-wider pb-0.5"
                    style={{
                      ...getElementTextStyle(styleConfig.sectionHeadingStyle, {
                        fallbackBold: true,
                      }),
                      borderBottom: `1px solid ${styleConfig.borderColor}`,
                    }}
                  >
                    Projects
                  </h3>
                  {SAMPLE_PREVIEW_DATA.projects.map((proj) => (
                    <div key={proj.id} className="space-y-0.5">
                      <div className="flex justify-between items-baseline gap-4">
                        <div>
                          <strong
                            className="font-bold"
                            style={{
                              ...getElementTextStyle(styleConfig.bodyStyle, {
                                fallbackBold: true,
                              }),
                              color: styleConfig.headingColor,
                            }}
                          >
                            {proj.title}
                          </strong>
                          <span className="text-slate-600"> ({proj.techStack})</span>
                        </div>
                        <span className="text-slate-500 shrink-0">{proj.link}</span>
                      </div>
                      <p style={getElementTextStyle(styleConfig.bodyStyle)}>
                        {proj.description}
                      </p>
                    </div>
                  ))}
                </section>
              )}

              {styleConfig.showCustomSections &&
                (styleConfig.useTables ? (
                  <section className="space-y-1.5">
                    <h3
                      className="uppercase tracking-wider pb-0.5"
                      style={{
                        ...getElementTextStyle(styleConfig.sectionHeadingStyle, {
                          fallbackBold: true,
                        }),
                        borderBottom: `1px solid ${styleConfig.borderColor}`,
                      }}
                    >
                      Additional Sections
                    </h3>
                    <table
                      className="w-full border-collapse"
                      style={{
                        borderColor: styleConfig.borderColor,
                        ...getElementTextStyle(styleConfig.bodyStyle),
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: `${styleConfig.accentColor}14` }}>
                          <th
                            className="text-left p-2 border font-bold w-44"
                            style={{ borderColor: styleConfig.borderColor }}
                          >
                            Section
                          </th>
                          <th
                            className="text-left p-2 border font-bold"
                            style={{ borderColor: styleConfig.borderColor }}
                          >
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {SAMPLE_PREVIEW_DATA.customSections.map((sec) => (
                          <tr key={sec.id}>
                            <td
                              className="p-2 border font-semibold"
                              style={{ borderColor: styleConfig.borderColor }}
                            >
                              {sec.heading}
                            </td>
                            <td
                              className="p-2 border whitespace-pre-line"
                              style={{ borderColor: styleConfig.borderColor }}
                            >
                              {sec.content}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                ) : (
                  SAMPLE_PREVIEW_DATA.customSections.map((sec) => (
                    <section key={sec.id} className="space-y-1">
                      <h3
                        className="uppercase tracking-wider pb-0.5"
                        style={{
                          ...getElementTextStyle(styleConfig.sectionHeadingStyle, {
                            fallbackBold: true,
                          }),
                          borderBottom: `1px solid ${styleConfig.borderColor}`,
                        }}
                      >
                        {sec.heading}
                      </h3>
                      <p
                        className="whitespace-pre-line"
                        style={getElementTextStyle(styleConfig.bodyStyle)}
                      >
                        {sec.content}
                      </p>
                    </section>
                  ))
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}