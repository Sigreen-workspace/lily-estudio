"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  BUILT_IN_TEMPLATES,
  CustomSectionItem,
  DEFAULT_TEMPLATE_STYLE,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  ResumeTemplateRecord,
  TemplateFontFamily,
  TemplateStyleConfig,
  TextElementStyle,
} from "@/types/resume";
import {
  FileText,
  Download,
  Plus,
  Trash2,
  ArrowLeft,
  LayoutTemplate,
  RotateCcw,
  FolderPlus,
  Pencil,
  Sparkles,
} from "lucide-react";

interface ParsedSkillEntry {
  skill: string;
  explanation?: string;
  level?: string;
}

function parseDetailedSkills(raw: string): {
  isDetailed: boolean;
  entries: ParsedSkillEntry[];
} {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const hasStructuredLines =
    lines.length > 0 && (lines.length > 1 || lines[0].includes(":"));

  if (!hasStructuredLines) {
    return { isDetailed: false, entries: [] };
  }

  const entries: ParsedSkillEntry[] = lines.map((line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      return { skill: line };
    }
    const skill = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();
    const lastCommaIdx = rest.lastIndexOf(",");
    if (lastCommaIdx !== -1) {
      const explanation = rest.slice(0, lastCommaIdx).trim();
      const level = rest.slice(lastCommaIdx + 1).trim();
      return {
        skill,
        explanation: explanation || undefined,
        level: level || undefined,
      };
    }
    return { skill, explanation: rest || undefined };
  });

  return { isDetailed: true, entries };
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

function resolveTemplateStyle(tpl: ResumeTemplateRecord): TemplateStyleConfig {
  const raw = tpl.style_config || {};
  const baseFont =
    raw.fontFamily ||
    (tpl.layout_style === "minimalist" ? "serif" : DEFAULT_TEMPLATE_STYLE.fontFamily);
  const baseDensity =
    raw.density ||
    (tpl.layout_style === "compact_one_page" ? "compact" : DEFAULT_TEMPLATE_STYLE.density);
  const baseHeaderStyle =
    raw.headerStyle ||
    (tpl.layout_style === "modern_tech"
      ? "banner"
      : tpl.layout_style === "minimalist"
      ? "centered"
      : DEFAULT_TEMPLATE_STYLE.headerStyle);

  return {
    ...DEFAULT_TEMPLATE_STYLE,
    ...raw,
    fontFamily: baseFont,
    density: baseDensity,
    headerStyle: baseHeaderStyle,
    nameStyle: {
      ...DEFAULT_TEMPLATE_STYLE.nameStyle,
      fontFamily: baseFont,
      ...(raw.nameStyle || {}),
    },
    headlineStyle: {
      ...DEFAULT_TEMPLATE_STYLE.headlineStyle,
      fontFamily: baseFont,
      ...(raw.headlineStyle || {}),
    },
    sectionHeadingStyle: {
      ...DEFAULT_TEMPLATE_STYLE.sectionHeadingStyle,
      fontFamily: baseFont,
      ...(raw.sectionHeadingStyle || {}),
    },
    bodyStyle: {
      ...DEFAULT_TEMPLATE_STYLE.bodyStyle,
      fontFamily: baseFont,
      ...(raw.bodyStyle || {}),
    },
  };
}

const SAMPLE_RESUME: ResumeData = {
  fullName: "Your Full Name",
  headline: "Degree Program • Core Specialization",
  email: "your.email@example.com",
  phone: "+00 00000 00000",
  location: "City, Country",
  linkedin: "linkedin.com/in/your-profile",
  github: "github.com/your-username",
  summary:
    "Motivated undergraduate with strong analytical skills, hands-on project experience, and a solid foundation in problem solving and modern technical workflows.",
  skills:
    "Skill One: Core technical concept and practical implementation, Advanced\nSkill Two: Analytical modeling, testing, and workflow optimization, Intermediate\nSkill Three: Documentation, version control, and collaborative delivery, Proficient",
  education: [
    {
      id: "edu-1",
      degree: "Bachelor's Degree in Engineering / Science",
      institution: "University / Institute Name",
      year: "YYYY – YYYY",
      grade: "CGPA: 8.0 / 10",
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "Summer Intern / Trainee",
      organization: "Organization / Company Name",
      duration: "Month YYYY – Month YYYY",
      bullets:
        "Assisted with technical workflows, testing, and structured operational analysis.\nPrepared clear documentation, summaries, and weekly progress reports.",
    },
  ],
  projects: [
    {
      id: "proj-1",
      title: "Full-Stack Web / Engineering Project",
      techStack: "TypeScript, React, Next.js, SQL",
      link: "github.com/your-username/project-repo",
      description:
        "Designed and implemented an end-to-end solution featuring modular architecture, clean data models, and responsive user interfaces.",
    },
  ],
  customSections: [
    {
      id: "sec-lang-sample",
      heading: "Languages",
      content: "English (Fluent), Native Language (Proficient)",
    },
    {
      id: "sec-cert-sample",
      heading: "Certifications",
      content: "Relevant Technical Certification One\nRelevant Technical Certification Two",
    },
  ],
};

const EMPTY_RESUME: ResumeData = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  summary: "",
  skills: "",
  education: [
    {
      id: "edu-1",
      degree: "",
      institution: "",
      year: "",
      grade: "",
    },
  ],
  experience: [
    {
      id: "exp-1",
      role: "",
      organization: "",
      duration: "",
      bullets: "",
    },
  ],
  projects: [
    {
      id: "proj-1",
      title: "",
      techStack: "",
      link: "",
      description: "",
    },
  ],
  customSections: [],
};

const SECTION_PRESETS = [
  { heading: "Languages" },
  { heading: "Certifications" },
  { heading: "Achievements & Extracurriculars" },
  { heading: "Relevant Coursework" },
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCustomHtml(html: string, resume: ResumeData): string {
  return html
    .replaceAll("{{fullName}}", escapeHtml(resume.fullName || "Your Full Name"))
    .replaceAll("{{headline}}", escapeHtml(resume.headline || ""))
    .replaceAll("{{email}}", escapeHtml(resume.email || ""))
    .replaceAll("{{phone}}", escapeHtml(resume.phone || ""))
    .replaceAll("{{location}}", escapeHtml(resume.location || ""))
    .replaceAll("{{linkedin}}", escapeHtml(resume.linkedin || ""))
    .replaceAll("{{github}}", escapeHtml(resume.github || ""))
    .replaceAll("{{summary}}", escapeHtml(resume.summary || ""))
    .replaceAll("{{skills}}", escapeHtml(resume.skills || ""));
}

export default function ResumeBuilderPage() {
  return (
    <ProtectedRoute allowedRoles={["student", "teacher", "mentor", "admin"]}>
      <ResumeBuilderWorkspace />
    </ProtectedRoute>
  );
}

function ResumeBuilderWorkspace() {
  const { profile } = useAuth();
  const idCounterRef = useRef(10);
  const [customTemplates, setCustomTemplates] = useState<ResumeTemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("classic_ats");
  const [data, setData] = useState<ResumeData>(SAMPLE_RESUME);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [skillInputName, setSkillInputName] = useState("");
  const [skillInputDesc, setSkillInputDesc] = useState("");
  const [skillInputLevel, setSkillInputLevel] = useState("Intermediate");

  const nextId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  useEffect(() => {
    let ignore = false;

    async function fetchInitialTemplates() {
      try {
        const { data: rows, error } = await supabase
          .from("resume_templates")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!ignore && !error && Array.isArray(rows)) {
          setCustomTemplates(rows as ResumeTemplateRecord[]);
        }
      } catch {
        // Keep built-in templates available if table is not yet created
      }
    }

    void fetchInitialTemplates();

    return () => {
      ignore = true;
    };
  }, []);

  const updateField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddFormattedSkill = () => {
    const cleanSkill = skillInputName.trim();
    if (!cleanSkill) return;
    const cleanDesc = skillInputDesc.trim();
    const cleanLevel = skillInputLevel.trim();

    let line = cleanSkill;
    if (cleanDesc && cleanLevel) {
      line = `${cleanSkill}: ${cleanDesc}, ${cleanLevel}`;
    } else if (cleanDesc) {
      line = `${cleanSkill}: ${cleanDesc}`;
    } else if (cleanLevel) {
      line = `${cleanSkill}: ${cleanLevel}`;
    }

    const current = data.skills.trim();
    updateField("skills", current ? `${current}\n${line}` : line);
    setSkillInputName("");
    setSkillInputDesc("");
  };

  const handleSelectTemplate = (tpl: ResumeTemplateRecord) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.default_data && typeof tpl.default_data === "object") {
      setData((prev) => ({
        ...prev,
        ...tpl.default_data,
        education: Array.isArray(tpl.default_data?.education)
          ? tpl.default_data.education
          : prev.education,
        experience: Array.isArray(tpl.default_data?.experience)
          ? tpl.default_data.experience
          : prev.experience,
        projects: Array.isArray(tpl.default_data?.projects)
          ? tpl.default_data.projects
          : prev.projects,
        customSections: Array.isArray(tpl.default_data?.customSections)
          ? tpl.default_data.customSections
          : prev.customSections,
      }));
    }
  };

  const handleDeleteCustomTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this custom template?")) return;
    const { error } = await supabase.from("resume_templates").delete().eq("id", id);
    if (!error) {
      setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplateId === id) setSelectedTemplateId("classic_ats");
    }
  };

  const addEducation = () => {
    updateField("education", [
      ...data.education,
      {
        id: nextId("edu"),
        degree: "",
        institution: "",
        year: "",
        grade: "",
      },
    ]);
  };

  const addExperience = () => {
    updateField("experience", [
      ...data.experience,
      {
        id: nextId("exp"),
        role: "",
        organization: "",
        duration: "",
        bullets: "",
      },
    ]);
  };

  const addProject = () => {
    updateField("projects", [
      ...data.projects,
      {
        id: nextId("proj"),
        title: "",
        techStack: "",
        link: "",
        description: "",
      },
    ]);
  };

  const addCustomSection = (presetHeading?: string) => {
    const title = (presetHeading ?? newSectionTitle).trim() || "Additional Section";
    const newSec: CustomSectionItem = {
      id: nextId("sec"),
      heading: title,
      content: "",
    };
    updateField("customSections", [...data.customSections, newSec]);
    if (!presetHeading) setNewSectionTitle("");
  };

  const handleDownloadPdf = () => {
    const prevTitle = document.title;
    const rawName = (data.fullName || "").trim();
    const baseName =
      rawName && rawName.toLowerCase() !== "your full name"
        ? rawName.replace(/\s+/g, "_")
        : "Candidate";
    document.title = `${baseName}_Resume`;
    window.print();
    window.setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  const handleLoadSample = () => {
    setData(SAMPLE_RESUME);
  };

  const handleClearAll = () => {
    if (!window.confirm("Clear all fields to start with a blank resume?")) return;
    setSelectedTemplateId("classic_ats");
    setData(EMPTY_RESUME);
  };

  const canManageTemplates = profile?.role === "admin" || profile?.role === "teacher";
  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];
  const activeTemplate =
    allTemplates.find((t) => t.id === selectedTemplateId) || BUILT_IN_TEMPLATES[0];

  const resolvedStyle = resolveTemplateStyle(activeTemplate);
  const isModern = activeTemplate.layout_style === "modern_tech";
  const isBannerHeader = resolvedStyle.headerStyle === "banner";

  const spacingClass =
    resolvedStyle.density === "compact"
      ? "p-7 leading-snug space-y-3"
      : resolvedStyle.density === "spacious"
      ? "p-10 leading-loose space-y-5"
      : "p-9 leading-relaxed space-y-4";

  const sectionHeadingCss: React.CSSProperties = isModern
    ? getElementTextStyle(resolvedStyle.sectionHeadingStyle, { fallbackBold: true })
    : {
        ...getElementTextStyle(resolvedStyle.sectionHeadingStyle, { fallbackBold: true }),
        borderBottom: `1px solid ${resolvedStyle.borderColor}`,
      };

  const bodyCss = getElementTextStyle(resolvedStyle.bodyStyle);
  const boldBodyCss: React.CSSProperties = {
    ...getElementTextStyle(resolvedStyle.bodyStyle, { fallbackBold: true }),
    color: resolvedStyle.headingColor,
  };

  const hasEducationContent = data.education.some(
    (edu) =>
      edu.degree.trim() || edu.institution.trim() || edu.year.trim() || edu.grade.trim()
  );

  const hasExperienceContent = data.experience.some(
    (exp) =>
      exp.role.trim() ||
      exp.organization.trim() ||
      exp.duration.trim() ||
      exp.bullets.trim()
  );

  const hasProjectContent = data.projects.some(
    (proj) =>
      proj.title.trim() ||
      proj.techStack.trim() ||
      proj.link.trim() ||
      proj.description.trim()
  );

  const parsedSkills = parseDetailedSkills(data.skills);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C899D] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Workspace
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#74B49B]" /> CV &amp; Resume Maker
          </h1>
          <p className="text-xs text-slate-500">
            Choose from {allTemplates.length} templates, customize sample sections, and download an unbranded PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canManageTemplates && (
            <Link
              href="/resume-builder/studio"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#5C899D] hover:bg-[#4a7285] rounded-xl transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Template Studio</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#427563] bg-[#74B49B]/15 hover:bg-[#74B49B]/25 rounded-xl transition cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" /> Load Sample
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear All
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#74B49B] hover:bg-[#5f9c85] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Template Selector Strip (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <LayoutTemplate className="w-4 h-4 text-[#5C899D]" />
            Select Resume Template ({allTemplates.length} Available)
          </h2>
          {canManageTemplates && (
            <Link
              href="/resume-builder/studio"
              className="text-xs font-bold text-[#5C899D] hover:underline"
            >
              + Create Custom Template
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {allTemplates.map((tpl) => {
            const active = activeTemplate.id === tpl.id;
            const isCustom = !tpl.isBuiltIn;
            return (
              <div
                key={tpl.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectTemplate(tpl)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectTemplate(tpl);
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer space-y-1.5 ${
                  active
                    ? "border-[#74B49B] bg-[#74B49B]/10 shadow-2xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs font-extrabold text-slate-800 truncate">
                    {tpl.name}
                  </strong>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#427563] border border-slate-200 shrink-0">
                    {tpl.tag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {tpl.description}
                </p>

                {canManageTemplates && isCustom && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                    <Link
                      href={`/resume-builder/studio?id=${encodeURIComponent(tpl.id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5C899D] hover:underline"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => void handleDeleteCustomTemplate(e, tpl.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Editor Left + Live A4 Preview Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Form Editor (Hidden on Print) */}
        <div className="no-print xl:col-span-5 space-y-5">
          {/* Personal Details */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800">1. Personal &amp; Contact Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                placeholder="Your Full Name"
                value={data.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200"
              />
              <input
                type="text"
                placeholder="Degree Program • Core Specialization"
                value={data.headline}
                onChange={(e) => updateField("headline", e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200"
              />
              <input
                type="email"
                placeholder="your.email@example.com"
                value={data.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200"
              />
              <input
                type="text"
                placeholder="+00 00000 00000"
                value={data.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200"
              />
              <input
                type="text"
                placeholder="City, Country"
                value={data.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200"
              />
              <input
                type="text"
                placeholder="linkedin.com/in/your-profile"
                value={data.linkedin}
                onChange={(e) => updateField("linkedin", e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200"
              />
              <input
                type="text"
                placeholder="github.com/your-username"
                value={data.github}
                onChange={(e) => updateField("github", e.target.value)}
                className="p-2.5 rounded-xl border border-slate-200 sm:col-span-2"
              />
            </div>

            <textarea
              rows={2}
              placeholder="Write a 2–3 line professional or academic summary..."
              value={data.summary}
              onChange={(e) => updateField("summary", e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Skills */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">2. Technical &amp; Core Skills</h3>
              <span className="text-[10px] font-semibold text-slate-400">
                Supports comma list or Skill: explanation, level
              </span>
            </div>

            {/* Quick Builder for Skill: explanation, level */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Skill name"
                  value={skillInputName}
                  onChange={(e) => setSkillInputName(e.target.value)}
                  className="p-2 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  placeholder="Short explanation"
                  value={skillInputDesc}
                  onChange={(e) => setSkillInputDesc(e.target.value)}
                  className="p-2 rounded-lg border border-slate-200 bg-white"
                />
                <select
                  value={skillInputLevel}
                  onChange={(e) => setSkillInputLevel(e.target.value)}
                  className="p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Proficient">Proficient</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddFormattedSkill}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill Entry
              </button>
            </div>

            <textarea
              rows={4}
              placeholder={
                "Write comma-separated skills OR one per line as:\nSkill: explanation, level"
              }
              value={data.skills}
              onChange={(e) => updateField("skills", e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
            />
          </div>

          {/* Education */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">3. Education</h3>
              <button
                type="button"
                onClick={addEducation}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>

            {data.education.map((edu: EducationItem, idx: number) => (
              <div
                key={edu.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">Entry #{idx + 1}</span>
                  {data.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "education",
                          data.education.filter((item) => item.id !== edu.id)
                        )
                      }
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Degree / Qualification"
                  value={edu.degree}
                  onChange={(e) =>
                    updateField(
                      "education",
                      data.education.map((item) =>
                        item.id === edu.id ? { ...item, degree: e.target.value } : item
                      )
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  placeholder="University / Institute Name"
                  value={edu.institution}
                  onChange={(e) =>
                    updateField(
                      "education",
                      data.education.map((item) =>
                        item.id === edu.id ? { ...item, institution: e.target.value } : item
                      )
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Years (YYYY – YYYY)"
                    value={edu.year}
                    onChange={(e) =>
                      updateField(
                        "education",
                        data.education.map((item) =>
                          item.id === edu.id ? { ...item, year: e.target.value } : item
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="CGPA / Percentage"
                    value={edu.grade}
                    onChange={(e) =>
                      updateField(
                        "education",
                        data.education.map((item) =>
                          item.id === edu.id ? { ...item, grade: e.target.value } : item
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Experience / Internships */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">4. Internships &amp; Experience</h3>
              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            {data.experience.map((exp: ExperienceItem, idx: number) => (
              <div
                key={exp.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">Role #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "experience",
                        data.experience.filter((item) => item.id !== exp.id)
                      )
                    }
                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Role / Title"
                    value={exp.role}
                    onChange={(e) =>
                      updateField(
                        "experience",
                        data.experience.map((item) =>
                          item.id === exp.id ? { ...item, role: e.target.value } : item
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={exp.duration}
                    onChange={(e) =>
                      updateField(
                        "experience",
                        data.experience.map((item) =>
                          item.id === exp.id ? { ...item, duration: e.target.value } : item
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Organization / Company Name"
                  value={exp.organization}
                  onChange={(e) =>
                    updateField(
                      "experience",
                      data.experience.map((item) =>
                        item.id === exp.id ? { ...item, organization: e.target.value } : item
                      )
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
                <textarea
                  rows={2}
                  placeholder="Key bullet points (one per line)"
                  value={exp.bullets}
                  onChange={(e) =>
                    updateField(
                      "experience",
                      data.experience.map((item) =>
                        item.id === exp.id ? { ...item, bullets: e.target.value } : item
                      )
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">5. Academic &amp; Technical Projects</h3>
              <button
                type="button"
                onClick={addProject}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C899D] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {data.projects.map((proj: ProjectItem, idx: number) => (
              <div
                key={proj.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">Project #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "projects",
                        data.projects.filter((item) => item.id !== proj.id)
                      )
                    }
                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Project Title"
                  value={proj.title}
                  onChange={(e) =>
                    updateField(
                      "projects",
                      data.projects.map((item) =>
                        item.id === proj.id ? { ...item, title: e.target.value } : item
                      )
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tools & Tech Stack"
                    value={proj.techStack}
                    onChange={(e) =>
                      updateField(
                        "projects",
                        data.projects.map((item) =>
                          item.id === proj.id ? { ...item, techStack: e.target.value } : item
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Repository / Live Link"
                    value={proj.link}
                    onChange={(e) =>
                      updateField(
                        "projects",
                        data.projects.map((item) =>
                          item.id === proj.id ? { ...item, link: e.target.value } : item
                        )
                      )
                    }
                    className="p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Brief overview of problem solved and impact"
                  value={proj.description}
                  onChange={(e) =>
                    updateField(
                      "projects",
                      data.projects.map((item) =>
                        item.id === proj.id ? { ...item, description: e.target.value } : item
                      )
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            ))}
          </div>

          {/* 6. Custom Sections */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#74B49B]" />
                6. Extra Sections (Languages, Certifications &amp; More)
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SECTION_PRESETS.map((preset) => (
                <button
                  key={preset.heading}
                  type="button"
                  onClick={() => addCustomSection(preset.heading)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#74B49B]/15 hover:text-[#427563] text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                >
                  + {preset.heading}
                </button>
              ))}
            </div>

            <div className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="Custom section name..."
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-slate-200"
              />
              <button
                type="button"
                onClick={() => addCustomSection()}
                className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#5C899D] hover:bg-[#4a7285] text-white font-bold transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Section
              </button>
            </div>

            {data.customSections.map((sec: CustomSectionItem, idx: number) => (
              <div
                key={sec.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder={`Section Heading #${idx + 1}`}
                    value={sec.heading}
                    onChange={(e) =>
                      updateField(
                        "customSections",
                        data.customSections.map((item) =>
                          item.id === sec.id ? { ...item, heading: e.target.value } : item
                        )
                      )
                    }
                    className="flex-1 p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "customSections",
                        data.customSections.filter((item) => item.id !== sec.id)
                      )
                    }
                    className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                    title="Remove section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Enter details (one line per point or comma-separated)..."
                  value={sec.content}
                  onChange={(e) =>
                    updateField(
                      "customSections",
                      data.customSections.map((item) =>
                        item.id === sec.id ? { ...item, content: e.target.value } : item
                      )
                    )
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Live A4 Sheet Preview */}
        <div className="xl:col-span-7 resume-print-wrapper">
          <div className="overflow-x-auto resume-print-wrapper">
            <div
              className={`resume-print-sheet bg-white mx-auto border border-slate-200 shadow-md text-slate-900 ${spacingClass}`}
              style={{
                width: "210mm",
                minHeight: "297mm",
                fontFamily: getFontCssFamily(resolvedStyle.fontFamily),
              }}
            >
              {activeTemplate.custom_html ? (
                <div
                  className="space-y-3"
                  dangerouslySetInnerHTML={{
                    __html: renderCustomHtml(activeTemplate.custom_html, data),
                  }}
                />
              ) : (
                <>
                  {/* Header Block */}
                  <div
                    className={
                      isBannerHeader
                        ? "p-5 rounded-2xl space-y-1.5"
                        : resolvedStyle.headerStyle === "left_bar"
                        ? "pl-4 py-1 space-y-1"
                        : resolvedStyle.headerStyle === "centered"
                        ? "pb-4 text-center space-y-1"
                        : "pb-3 space-y-1"
                    }
                    style={
                      isBannerHeader
                        ? { backgroundColor: resolvedStyle.headerBgColor }
                        : resolvedStyle.headerStyle === "left_bar"
                        ? { borderLeft: `4px solid ${resolvedStyle.accentColor}` }
                        : resolvedStyle.headerStyle === "centered"
                        ? { borderBottom: `1px solid ${resolvedStyle.borderColor}` }
                        : { borderBottom: `2px solid ${resolvedStyle.accentColor}` }
                    }
                  >
                    <h2
                      className="tracking-tight"
                      style={getElementTextStyle(resolvedStyle.nameStyle, {
                        fallbackBold: true,
                        forceColor:
                          isBannerHeader && resolvedStyle.nameStyle.tone === "dark"
                            ? "#ffffff"
                            : undefined,
                      })}
                    >
                      {data.fullName || "Your Full Name"}
                    </h2>
                    {data.headline && (
                      <p
                        style={getElementTextStyle(resolvedStyle.headlineStyle, {
                          fallbackBold: true,
                          forceColor:
                            isBannerHeader && resolvedStyle.headlineStyle.tone === "dark"
                              ? "#a7f3d0"
                              : undefined,
                        })}
                      >
                        {data.headline}
                      </p>
                    )}
                    <div
                      className={`flex flex-wrap gap-x-3 gap-y-1 text-[11px] pt-1 ${
                        isBannerHeader
                          ? "text-slate-200"
                          : resolvedStyle.headerStyle === "centered"
                          ? "justify-center text-slate-600"
                          : "text-slate-600"
                      }`}
                    >
                      {data.email && <span>{data.email}</span>}
                      {data.phone && <span>• {data.phone}</span>}
                      {data.location && <span>• {data.location}</span>}
                      {data.linkedin && <span>• {data.linkedin}</span>}
                      {data.github && <span>• {data.github}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {resolvedStyle.showSummary && data.summary.trim() && (
                    <section className="space-y-1">
                      <h3
                        className="uppercase tracking-wider pb-0.5"
                        style={sectionHeadingCss}
                      >
                        Summary
                      </h3>
                      <p style={bodyCss}>{data.summary}</p>
                    </section>
                  )}

                  {/* Education */}
                  {resolvedStyle.showEducation && hasEducationContent && (
                    <section className="space-y-2">
                      <h3
                        className="uppercase tracking-wider pb-0.5"
                        style={sectionHeadingCss}
                      >
                        Education
                      </h3>

                      {resolvedStyle.useTables ? (
                        <table
                          className="w-full border-collapse"
                          style={{
                            borderColor: resolvedStyle.borderColor,
                            ...bodyCss,
                          }}
                        >
                          <thead>
                            <tr style={{ backgroundColor: `${resolvedStyle.accentColor}14` }}>
                              <th
                                className="text-left p-2 border font-bold"
                                style={{ borderColor: resolvedStyle.borderColor }}
                              >
                                Degree / Qualification
                              </th>
                              <th
                                className="text-left p-2 border font-bold"
                                style={{ borderColor: resolvedStyle.borderColor }}
                              >
                                Institution
                              </th>
                              <th
                                className="text-left p-2 border font-bold"
                                style={{ borderColor: resolvedStyle.borderColor }}
                              >
                                Year
                              </th>
                              <th
                                className="text-left p-2 border font-bold"
                                style={{ borderColor: resolvedStyle.borderColor }}
                              >
                                Score / GPA
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.education
                              .filter(
                                (edu) =>
                                  edu.degree.trim() ||
                                  edu.institution.trim() ||
                                  edu.year.trim() ||
                                  edu.grade.trim()
                              )
                              .map((edu: EducationItem) => (
                                <tr key={edu.id}>
                                  <td
                                    className="p-2 border font-semibold"
                                    style={{ borderColor: resolvedStyle.borderColor }}
                                  >
                                    {edu.degree || "Degree"}
                                  </td>
                                  <td
                                    className="p-2 border"
                                    style={{ borderColor: resolvedStyle.borderColor }}
                                  >
                                    {edu.institution}
                                  </td>
                                  <td
                                    className="p-2 border"
                                    style={{ borderColor: resolvedStyle.borderColor }}
                                  >
                                    {edu.year}
                                  </td>
                                  <td
                                    className="p-2 border"
                                    style={{ borderColor: resolvedStyle.borderColor }}
                                  >
                                    {edu.grade}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="space-y-2">
                          {data.education
                            .filter(
                              (edu) =>
                                edu.degree.trim() ||
                                edu.institution.trim() ||
                                edu.year.trim() ||
                                edu.grade.trim()
                            )
                            .map((edu: EducationItem) => (
                              <div key={edu.id} className="flex justify-between items-start gap-4">
                                <div>
                                  <strong className="block" style={boldBodyCss}>
                                    {edu.degree || "Degree"}
                                  </strong>
                                  <span style={bodyCss}>{edu.institution}</span>
                                </div>
                                <div className="text-right shrink-0 text-slate-600">
                                  <span className="block font-semibold">{edu.year}</span>
                                  {edu.grade && <span className="text-[11px]">{edu.grade}</span>}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </section>
                  )}

                  {/* Skills (Supports both Comma-Separated and "Skill: explanation, level") */}
                  {resolvedStyle.showSkills && data.skills.trim() && (
                    <section className="space-y-1.5">
                      <h3
                        className="uppercase tracking-wider pb-0.5"
                        style={sectionHeadingCss}
                      >
                        Skills
                      </h3>

                      {parsedSkills.isDetailed ? (
                        <ul className="space-y-1.5" style={bodyCss}>
                          {parsedSkills.entries.map((item, idx) => (
                            <li
                              key={`${item.skill}-${idx}`}
                              className="flex items-baseline justify-between gap-3"
                            >
                              <div>
                                <strong style={boldBodyCss}>{item.skill}</strong>
                                {item.explanation && <span>: {item.explanation}</span>}
                              </div>
                              {item.level && (
                                <span
                                  className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-slate-100 shrink-0"
                                  style={{ color: resolvedStyle.accentColor }}
                                >
                                  {item.level}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : isModern ? (
                        <div className="flex flex-wrap gap-1.5">
                          {data.skills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <p style={bodyCss}>{data.skills}</p>
                      )}
                    </section>
                  )}

                  {/* Experience */}
                  {resolvedStyle.showExperience && hasExperienceContent && (
                    <section className="space-y-2">
                      <h3
                        className="uppercase tracking-wider pb-0.5"
                        style={sectionHeadingCss}
                      >
                        Experience &amp; Internships
                      </h3>
                      <div className="space-y-2.5">
                        {data.experience
                          .filter(
                            (exp) =>
                              exp.role.trim() ||
                              exp.organization.trim() ||
                              exp.duration.trim() ||
                              exp.bullets.trim()
                          )
                          .map((exp: ExperienceItem) => (
                            <div key={exp.id} className="space-y-1">
                              <div className="flex justify-between items-baseline gap-4">
                                <div>
                                  <strong style={boldBodyCss}>{exp.role}</strong>
                                  {exp.organization && (
                                    <span style={bodyCss}> — {exp.organization}</span>
                                  )}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                                  {exp.duration}
                                </span>
                              </div>
                              {exp.bullets.trim() && (
                                <ul className="list-disc pl-4 space-y-0.5" style={bodyCss}>
                                  {exp.bullets
                                    .split("\n")
                                    .map((line) => line.trim())
                                    .filter(Boolean)
                                    .map((line, i) => (
                                      <li key={i}>{line}</li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          ))}
                      </div>
                    </section>
                  )}

                  {/* Projects */}
                  {resolvedStyle.showProjects && hasProjectContent && (
                    <section className="space-y-2">
                      <h3
                        className="uppercase tracking-wider pb-0.5"
                        style={sectionHeadingCss}
                      >
                        Projects
                      </h3>
                      <div className="space-y-2.5">
                        {data.projects
                          .filter(
                            (proj) =>
                              proj.title.trim() ||
                              proj.techStack.trim() ||
                              proj.link.trim() ||
                              proj.description.trim()
                          )
                          .map((proj: ProjectItem) => (
                            <div key={proj.id} className="space-y-0.5">
                              <div className="flex justify-between items-baseline gap-4">
                                <div>
                                  <strong style={boldBodyCss}>{proj.title}</strong>
                                  {proj.techStack && (
                                    <span className="text-[11px] text-slate-600">
                                      {" "}
                                      ({proj.techStack})
                                    </span>
                                  )}
                                </div>
                                {proj.link && (
                                  <span
                                    className="text-[11px] shrink-0"
                                    style={{ color: resolvedStyle.accentColor }}
                                  >
                                    {proj.link}
                                  </span>
                                )}
                              </div>
                              {proj.description && <p style={bodyCss}>{proj.description}</p>}
                            </div>
                          ))}
                      </div>
                    </section>
                  )}

                  {/* Dynamic Custom Sections */}
                  {resolvedStyle.showCustomSections &&
                    (resolvedStyle.useTables &&
                    data.customSections.some((sec) => sec.heading.trim() || sec.content.trim()) ? (
                      <section className="space-y-1.5">
                        <h3
                          className="uppercase tracking-wider pb-0.5"
                          style={sectionHeadingCss}
                        >
                          Additional Sections
                        </h3>
                        <table
                          className="w-full border-collapse"
                          style={{
                            borderColor: resolvedStyle.borderColor,
                            ...bodyCss,
                          }}
                        >
                          <thead>
                            <tr style={{ backgroundColor: `${resolvedStyle.accentColor}14` }}>
                              <th
                                className="text-left p-2 border font-bold w-44"
                                style={{ borderColor: resolvedStyle.borderColor }}
                              >
                                Section
                              </th>
                              <th
                                className="text-left p-2 border font-bold"
                                style={{ borderColor: resolvedStyle.borderColor }}
                              >
                                Details
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.customSections
                              .filter((sec) => sec.heading.trim() || sec.content.trim())
                              .map((sec: CustomSectionItem) => (
                                <tr key={sec.id}>
                                  <td
                                    className="p-2 border font-semibold"
                                    style={{ borderColor: resolvedStyle.borderColor }}
                                  >
                                    {sec.heading || "Additional Section"}
                                  </td>
                                  <td
                                    className="p-2 border whitespace-pre-line"
                                    style={{ borderColor: resolvedStyle.borderColor }}
                                  >
                                    {sec.content}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </section>
                    ) : (
                      data.customSections
                        .filter((sec) => sec.heading.trim() || sec.content.trim())
                        .map((sec: CustomSectionItem) => {
                          const lines = sec.content
                            .split("\n")
                            .map((l) => l.trim())
                            .filter(Boolean);
                          return (
                            <section key={sec.id} className="space-y-1.5">
                              <h3
                                className="uppercase tracking-wider pb-0.5"
                                style={sectionHeadingCss}
                              >
                                {sec.heading || "Additional Section"}
                              </h3>
                              {lines.length > 1 ? (
                                <ul className="list-disc pl-4 space-y-0.5" style={bodyCss}>
                                  {lines.map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p style={bodyCss}>{sec.content}</p>
                              )}
                            </section>
                          );
                        })
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}