import { supabase, UserBadge } from "@/lib/supabase";

export interface DefinedBadge {
  badge_key: string;
  title: string;
  description: string;
  icon_name: string;
}

export const AVAILABLE_BADGES: DefinedBadge[] = [
  {
    badge_key: "first_course",
    title: "Curious Scholar",
    description: "Enrolled in and began studying your first academic course.",
    icon_name: "BookOpen",
  },
  {
    badge_key: "first_test",
    title: "Diagnostic Pioneer",
    description: "Completed your first self-assessment diagnostic test.",
    icon_name: "CheckCircle2",
  },
  {
    badge_key: "ten_questions",
    title: "Active Inquirer",
    description: "Answered 10 diagnostic questions across your learning tracks.",
    icon_name: "Target",
  },
  {
    badge_key: "first_deck",
    title: "Recall Practitioner",
    description: "Created or practiced with a flashcard spaced repetition deck.",
    icon_name: "Layers",
  },
  {
    badge_key: "first_scholarship_saved",
    title: "Opportunity Planner",
    description: "Saved an academic aid opportunity or fellowship guide.",
    icon_name: "Bookmark",
  },
  {
    badge_key: "first_mentorship_inquiry",
    title: "Proactive Learner",
    description: "Connected with an academic mentor for free consultation.",
    icon_name: "Compass",
  },
];

export async function logLearningActivity(
  userId: string,
  activityType: string,
  title: string
): Promise<void> {
  try {
    await supabase.from("user_activity_log").insert({
      user_id: userId,
      activity_type: activityType,
      title,
      activity_date: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

export async function checkAndUnlockBadge(
  userId: string,
  badgeKey: string
): Promise<UserBadge | null> {
  const badgeDef = AVAILABLE_BADGES.find((b) => b.badge_key === badgeKey);
  if (!badgeDef) return null;

  try {
    const { data: existing } = await supabase
      .from("user_badges")
      .select("*")
      .eq("user_id", userId)
      .eq("badge_key", badgeKey)
      .maybeSingle();

    if (existing) return existing as UserBadge;

    const { data, error } = await supabase
      .from("user_badges")
      .insert({
        user_id: userId,
        badge_key: badgeDef.badge_key,
        title: badgeDef.title,
        description: badgeDef.description,
        icon_name: badgeDef.icon_name,
      })
      .select()
      .single();

    if (!error && data) {
      return data as UserBadge;
    }
  } catch (err) {
    console.error("Badge award error:", err);
  }

  return null;
}