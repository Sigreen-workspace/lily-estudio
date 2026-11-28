export type BuiltInTemplateStyle =
  | "classic_ats"
  | "modern_tech"
  | "minimalist"
  | "compact_one_page";

export type TemplateFontFamily =
  | "sans"
  | "serif"
  | "mono"
  | "times"
  | "arial";

export type TemplateDensity = "compact" | "comfortable" | "spacious";
export type TemplateHeaderStyle = "underline" | "left_bar" | "banner" | "centered";
export type TemplateTextSize = "xs" | "sm" | "md";
export type TextTone = "dark" | "light";

export interface TextElementStyle {
  color: string;
  fontSizePx: number;
  fontFamily: TemplateFontFamily;
  bold: boolean;
  tone: TextTone;
}

export interface TemplateStyleConfig {
  accentColor: string;
  headingColor: string;
  borderColor: string;
  headerBgColor: string;
  fontFamily: TemplateFontFamily;
  textSize: TemplateTextSize;
  headerStyle: TemplateHeaderStyle;
  density: TemplateDensity;
  useTables: boolean;
  showSummary: boolean;
  showEducation: boolean;
  showSkills: boolean;
  showExperience: boolean;
  showProjects: boolean;
  showCustomSections: boolean;
  nameStyle: TextElementStyle;
  headlineStyle: TextElementStyle;
  sectionHeadingStyle: TextElementStyle;
  bodyStyle: TextElementStyle;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  duration: string;
  bullets: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  techStack: string;
  link: string;
  description: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  grade: string;
}

export interface CustomSectionItem {
  id: string;
  heading: string;
  content: string;
}

export interface ResumeData {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  customSections: CustomSectionItem[];
}

export interface ResumeTemplateRecord {
  id: string;
  name: string;
  tag: string;
  description: string;
  layout_style: BuiltInTemplateStyle;
  style_config?: Partial<TemplateStyleConfig> | null;
  custom_html?: string | null;
  default_data?: Partial<ResumeData> | null;
  created_by?: string | null;
  created_by_role?: string | null;
  is_active?: boolean;
  isBuiltIn?: boolean;
}

export const DEFAULT_TEMPLATE_STYLE: TemplateStyleConfig = {
  accentColor: "#427563",
  headingColor: "#0f172a",
  borderColor: "#cbd5e1",
  headerBgColor: "#0f172a",
  fontFamily: "sans",
  textSize: "sm",
  headerStyle: "underline",
  density: "comfortable",
  useTables: false,
  showSummary: true,
  showEducation: true,
  showSkills: true,
  showExperience: true,
  showProjects: true,
  showCustomSections: true,
  nameStyle: {
    color: "#0f172a",
    fontSizePx: 24,
    fontFamily: "sans",
    bold: true,
    tone: "dark",
  },
  headlineStyle: {
    color: "#427563",
    fontSizePx: 12,
    fontFamily: "sans",
    bold: true,
    tone: "dark",
  },
  sectionHeadingStyle: {
    color: "#427563",
    fontSizePx: 11,
    fontFamily: "sans",
    bold: true,
    tone: "dark",
  },
  bodyStyle: {
    color: "#334155",
    fontSizePx: 12,
    fontFamily: "sans",
    bold: false,
    tone: "dark",
  },
};

export const BUILT_IN_TEMPLATES: ResumeTemplateRecord[] = [
  {
    id: "classic_ats",
    name: "Classic ATS",
    tag: "99% ATS Safe",
    description: "Single-column layout ideal for campus placements & core roles.",
    layout_style: "classic_ats",
    style_config: DEFAULT_TEMPLATE_STYLE,
    isBuiltIn: true,
  },
  {
    id: "modern_tech",
    name: "Modern Tech",
    tag: "SDE / Product",
    description: "Clean accent header with highlighted project & stack badges.",
    layout_style: "modern_tech",
    style_config: {
      ...DEFAULT_TEMPLATE_STYLE,
      accentColor: "#0f766e",
      headingColor: "#0f172a",
      headerStyle: "banner",
      headlineStyle: {
        ...DEFAULT_TEMPLATE_STYLE.headlineStyle,
        color: "#a7f3d0",
        tone: "light",
      },
      sectionHeadingStyle: {
        ...DEFAULT_TEMPLATE_STYLE.sectionHeadingStyle,
        color: "#0f766e",
      },
    },
    isBuiltIn: true,
  },
  {
    id: "minimalist",
    name: "Minimalist Academic",
    tag: "Research / MS",
    description: "Refined serif typography suited for higher studies & fellowships.",
    layout_style: "minimalist",
    style_config: {
      ...DEFAULT_TEMPLATE_STYLE,
      fontFamily: "serif",
      headerStyle: "centered",
      accentColor: "#334155",
      nameStyle: {
        ...DEFAULT_TEMPLATE_STYLE.nameStyle,
        fontFamily: "serif",
      },
      headlineStyle: {
        ...DEFAULT_TEMPLATE_STYLE.headlineStyle,
        fontFamily: "serif",
        color: "#334155",
      },
      sectionHeadingStyle: {
        ...DEFAULT_TEMPLATE_STYLE.sectionHeadingStyle,
        fontFamily: "serif",
        color: "#334155",
      },
      bodyStyle: {
        ...DEFAULT_TEMPLATE_STYLE.bodyStyle,
        fontFamily: "serif",
      },
    },
    isBuiltIn: true,
  },
  {
    id: "compact_one_page",
    name: "Compact 1-Page",
    tag: "Dense Layout",
    description: "Tighter spacing to fit internships, projects & coursework on 1 page.",
    layout_style: "compact_one_page",
    style_config: {
      ...DEFAULT_TEMPLATE_STYLE,
      textSize: "xs",
      density: "compact",
      nameStyle: {
        ...DEFAULT_TEMPLATE_STYLE.nameStyle,
        fontSizePx: 20,
      },
      sectionHeadingStyle: {
        ...DEFAULT_TEMPLATE_STYLE.sectionHeadingStyle,
        fontSizePx: 10.5,
      },
      bodyStyle: {
        ...DEFAULT_TEMPLATE_STYLE.bodyStyle,
        fontSizePx: 11,
      },
    },
    isBuiltIn: true,
  },
];