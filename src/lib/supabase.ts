import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = "student" | "teacher" | "mentor" | "admin";
export type AcademicTrack = "school" | "college" | "competitive_exam" | "study_abroad" | "skill";
export type ContentStatus = "draft" | "submitted" | "published" | "archived";
export type MentorshipStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

export interface Board {
  id: string;
  name: string;
  code: string;
}

export interface AcademicProgram {
  id: string;
  track: AcademicTrack;
  title: string;
  board_id: string | null;
  class_grade: number | null;
  degree_name: string | null;
  branch: string | null;
  semester: number | null;
  exam_target: string | null;
  boards?: Board;
}

export interface Subject {
  id: string;
  program_id: string;
  name: string;
  title?: string;
  code: string | null;
  description: string | null;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  chapter_number: number;
  description: string | null;
}

export interface Topic {
  id: string;
  chapter_id: string;
  title: string;
  order_index: number;
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  education_level: string | null;
  institution: string | null;
  class_semester: string | null;
  course_branch: string | null;
  interests: string[] | null;
  country: string | null;
  learning_preference: string | null;
  target_track?: AcademicTrack | null;
  selected_program_id?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  experience_years?: number | null;
  teaching_subjects?: string[] | null;
  teaching_classes?: string[] | null;
  boards_systems?: string[] | null;
  is_available_for_mentorship?: boolean | null;
  mentorship_topics?: string[] | null;
  expertise_tracks?: AcademicTrack[] | null;
  languages_spoken?: string[] | null;
  max_active_mentees?: number | null;
  created_at: string;
  updated_at: string;
}

export type Profile = UserProfile;

export interface MentorshipRequest {
  id: string;
  student_id: string;
  mentor_id: string;
  topic: string;
  academic_track: AcademicTrack;
  message: string;
  status: MentorshipStatus;
  mentor_response?: string | null;
  session_schedule?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  target_user_id: string;
  request_id?: string | null;
  reason: string;
  details?: string | null;
  status: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export interface Course {
  id: string;
  category_id: string | null;
  program_id?: string | null;
  subject_id?: string | null;
  chapter_id?: string | null;
  created_by?: string | null;
  status: ContentStatus;
  title: string;
  slug: string;
  description: string;
  instructor: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  estimated_hours: number;
  thumbnail_gradient: string;
  created_at: string;
  categories?: Category;
  academic_programs?: AcademicProgram;
  subjects?: Subject;
  review_status?: ContentReviewStatus;
  rejection_reason?: string | null;
}

export interface Resource {
  id: string;
  course_id: string;
  created_by?: string | null;
  title: string;
  resource_type: "video" | "note" | "tutorial" | "link";
  url: string;
  duration_minutes: number;
  order_index: number;
}

export interface PracticeTest {
  id: string;
  category_id: string | null;
  created_by?: string | null;
  status: ContentStatus;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  total_questions: number;
  difficulty: "Easy" | "Medium" | "Hard";
  created_at: string;
  categories?: Category;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  explanation: string;
  order_index: number;
  question_options: QuestionOption[];
}

export interface TestAttempt {
  id: string;
  test_id: string;
  session_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  time_spent_seconds: number;
  completed_at: string;
  tests?: PracticeTest;
}

// Phase 7 Flashcard Engine Types
export interface FlashcardDeck {
  id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  academic_track: AcademicTrack;
  subject_name: string;
  is_public: boolean;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcardCard {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  hint_text: string | null;
  order_index: number;
  created_at: string;
}

export interface FlashcardReview {
  id: string;
  user_id: string;
  card_id: string;
  deck_id: string;
  box_level: number;
  interval_days: number;
  consecutive_correct: number;
  total_reviews: number;
  last_reviewed_at: string;
  next_review_at: string;
}

// Phase 8 Personal Dashboard & Authentic Progress Types
export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed_lessons: number;
  total_lessons: number;
  progress_percent: number;
  is_completed: boolean;
  last_accessed_at: string;
  courses?: Course;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  title: string;
  description: string;
  icon_name: string;
  unlocked_at: string;
}

export interface SavedResource {
  id: string;
  user_id: string;
  resource_type: "course" | "scholarship" | "guide";
  item_id: string;
  title: string;
  subtitle?: string | null;
  target_url: string;
  created_at: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  activity_date: string;
  created_at: string;
}

// Phase 9 Scholarship Engine Types
export type ScholarshipApplicationStatus =
  | "interested"
  | "planning"
  | "applied"
  | "shortlisted"
  | "rejected"
  | "completed";

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  country: string;
  study_level: string;
  degree_field: string;
  eligibility_criteria: string;
  deadline_date: string | null;
  requirements: string | null;
  amount_benefit: string;
  official_url: string;
  description: string;
  is_verified: boolean;
  is_demo: boolean;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface StudentScholarshipTracker {
  id: string;
  user_id: string;
  scholarship_id: string;
  status: ScholarshipApplicationStatus;
  personal_notes: string | null;
  target_deadline: string | null;
  created_at: string;
  updated_at: string;
  scholarships?: Scholarship;
}

// Phase 10 Notification & Reminder Types
export type NotificationType =
  | "scholarship_deadline"
  | "saved_learning_reminder"
  | "flashcard_review"
  | "test_reminder"
  | "mentorship_request"
  | "community_activity";

export interface NotificationItem {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  target_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UserNotificationPreferences {
  id: string;
  user_id: string;
  notify_scholarship_deadlines: boolean;
  notify_learning_reminders: boolean;
  notify_flashcard_reviews: boolean;
  notify_test_reminders: boolean;
  notify_mentorship_updates: boolean;
  notify_community_activity: boolean;
  email_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 11 Community Forum Types
export type CommunityCategory =
  | "school"
  | "college"
  | "exams"
  | "scholarships"
  | "study_abroad"
  | "career"
  | "general";

export interface ForumPost {
  id: string;
  author_id: string;
  category: CommunityCategory;
  title: string;
  content: string;
  tags: string[];
  upvotes_count: number;
  answers_count: number;
  is_pinned: boolean;
  is_solved: boolean;
  is_moderated: boolean;
  moderation_reason?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
}

export interface ForumAnswer {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  upvotes_count: number;
  is_accepted: boolean;
  is_moderated: boolean;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
}

export interface ForumReport {
  id: string;
  reporter_id: string;
  target_type: "post" | "answer" | "user";
  target_id: string;
  reason: string;
  details?: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
}

// Phase 12 Admin Governance & Mentor Profile Types
export type ContentReviewStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "published";

export type MentorVerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export interface MentorProfile {
  id: string;
  user_id: string;
  headline?: string | null;
  bio?: string | null;
  institution?: string | null;
  expertise?: string[] | null;
  is_verified?: boolean;
  verification_status?: MentorVerificationStatus;
  verified_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: UserProfile;
}

export interface AdminStatsOverview {
  totalStudents: number;
  totalTeachers: number;
  totalMentors: number;
  totalCourses: number;
  pendingReviews: number;
  pendingMentors: number;
  pendingReports: number;
}

export type TeacherVerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  education_level: string | null;
  institution: string | null;
  class_semester: string | null;
  course_branch: string | null;
  interests: string[] | null;
  country: string | null;
  learning_preference: string | null;
  target_track?: AcademicTrack | null;
  selected_program_id?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  experience_years?: number | null;
  teaching_subjects?: string[] | null;
  teaching_classes?: string[] | null;
  boards_systems?: string[] | null;
  is_available_for_mentorship?: boolean | null;
  mentorship_topics?: string[] | null;
  expertise_tracks?: AcademicTrack[] | null;
  languages_spoken?: string[] | null;
  max_active_mentees?: number | null;
  teacher_verification_status?: TeacherVerificationStatus;
  is_teacher_verified?: boolean;
  verification_submitted_at?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
  institution_email?: string | null;
  credentials_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformFeedback {
  id: string;
  user_id?: string | null;
  user_email: string;
  user_name?: string | null;
  feedback_type: "suggestion" | "bug_report" | "support" | "general";
  subject: string;
  message: string;
  status: "unread" | "in_review" | "resolved";
  created_at: string;
}

export interface SocialContactsSettings {
  email: string;
  lead_email: string;
  youtube: string;
  linkedin: string;
  github: string;
  twitter: string;
  telegram?: string;
  whatsapp?: string;
}

/**
 * Sanitizes external and user-submitted links.
 * Blocks javascript: and data: pseudoprotocols from executing in hrefs.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url) return "#";
  const trimmed = url.trim();
  
  // Allow relative local routes
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  
  // Enforce HTTP / HTTPS protocols
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // Block dangerous schemes
  return "#";
}

/**
 * Strips HTML markup to prevent stored XSS in plain-text fields.
 */
export function sanitizeText(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export interface SocialContactsSettings {
  email: string;
  lead_email: string;
  youtube: string;
  linkedin: string;
  github: string;
  twitter: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
}