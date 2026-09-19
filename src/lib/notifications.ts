import { supabase, NotificationType, NotificationItem, UserNotificationPreferences } from "@/lib/supabase";

export async function getUserNotificationPreferences(
  userId: string
): Promise<UserNotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data && !error) {
      // Initialize defaults
      const { data: created } = await supabase
        .from("user_notification_preferences")
        .insert({ user_id: userId })
        .select()
        .single();
      return created as UserNotificationPreferences;
    }

    return data as UserNotificationPreferences;
  } catch (err) {
    console.error("Failed to load preferences:", err);
    return null;
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  targetUrl: string = "/dashboard/student"
): Promise<NotificationItem | null> {
  try {
    const prefs = await getUserNotificationPreferences(userId);

    // Check if user has muted this notification type
    if (prefs) {
      if (type === "scholarship_deadline" && !prefs.notify_scholarship_deadlines) return null;
      if (type === "saved_learning_reminder" && !prefs.notify_learning_reminders) return null;
      if (type === "flashcard_review" && !prefs.notify_flashcard_reviews) return null;
      if (type === "test_reminder" && !prefs.notify_test_reminders) return null;
      if (type === "mentorship_request" && !prefs.notify_mentorship_updates) return null;
      if (type === "community_activity" && !prefs.notify_community_activity) return null;
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        notification_type: type,
        title,
        message,
        target_url: targetUrl,
        is_read: false,
      })
      .select()
      .single();

    if (!error && data) {
      return data as NotificationItem;
    }
  } catch (err) {
    console.error("Failed to dispatch in-app notification:", err);
  }
  return null;
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    return !error;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    return !error;
  } catch {
    return false;
  }
}