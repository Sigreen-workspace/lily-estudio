"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  supabase,
  NotificationItem,
  NotificationType,
  UserNotificationPreferences,
} from "@/lib/supabase";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserNotificationPreferences,
} from "@/lib/notifications";
import {
  Bell,
  CheckCheck,
  Calendar,
  Layers,
  BookOpen,
  Target,
  Compass,
  MessageSquare,
  CheckCircle2,
  Settings,
  ExternalLink,
  Trash2,
} from "lucide-react";

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["student", "teacher", "mentor", "admin"]}>
      <NotificationsContent />
    </ProtectedRoute>
  );
}

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  scholarship_deadline: {
    label: "Scholarship Deadline",
    icon: Calendar,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  flashcard_review: {
    label: "Flashcard Due",
    icon: Layers,
    color: "text-sky-600",
    bg: "bg-sky-50 border-sky-200",
  },
  saved_learning_reminder: {
    label: "Study Reminder",
    icon: BookOpen,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
  },
  test_reminder: {
    label: "Practice Test",
    icon: Target,
    color: "text-teal-600",
    bg: "bg-teal-50 border-teal-200",
  },
  mentorship_request: {
    label: "Mentorship",
    icon: Compass,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
  },
  community_activity: {
    label: "Community",
    icon: MessageSquare,
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
  },
};

function NotificationsContent() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "deadlines">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchNotifications() {
      if (!user) return;
      try {
        // Trigger sample initialization if empty
        await supabase.rpc("seed_initial_student_notifications", {
          target_user_id: user.id,
        });

        // If the user is an admin, ensure they also receive pending mentor review notifications or fetch relevant ones
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!ignore && !error && data) {
          setNotifications(data as NotificationItem[]);
        }

        const prefs = await getUserNotificationPreferences(user.id);
        if (!ignore) {
          setPreferences(prefs);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchNotifications();

    // Set up Realtime subscription for fresh notifications including mentor alerts
    const channel = supabase
      .channel(`notifications-page-${user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        (payload) => {
          if (!ignore && payload.new) {
            setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const success = await markAllNotificationsAsRead(user.id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert("Failed to delete notification.");
    }
  };

  const handleTogglePreference = async (key: keyof UserNotificationPreferences) => {
    if (!user || !preferences) return;
    setSavingPref(true);
    const updatedVal = !preferences[key];

    try {
      const { error } = await supabase
        .from("user_notification_preferences")
        .update({ [key]: updatedVal, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (!error) {
        setPreferences((prev) => (prev ? { ...prev, [key]: updatedVal } : null));
      }
    } catch (err) {
      console.error("Failed to update preferences:", err);
    } finally {
      setSavingPref(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.is_read;
    if (activeTab === "deadlines") return n.notification_type === "scholarship_deadline";
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#A7D7C5]/30 to-[#A2C4C9]/30 rounded-3xl p-6 sm:p-8 border border-[#74B49B]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#427563] shadow-2xs">
            In-App Notification Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Academic Alerts &amp; Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Non-intrusive, milestone-driven reminders for your deadlines, reviews, and administrative queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl transition shadow-2xs cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#74B49B]" /> Mark All as Read
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5C899D] hover:bg-[#4a7285] text-white text-xs font-semibold rounded-xl transition shadow-2xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            {showSettings ? "Hide Preferences" : "Reminder Settings"}
          </button>
        </div>
      </div>

      {/* Reminder Preferences Settings Panel */}
      {showSettings && preferences && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Reminder Preferences</h2>
              <p className="text-xs text-slate-500">
                Choose which academic alerts you want to receive in your workspace.
              </p>
            </div>
            {savingPref && <span className="text-[11px] text-[#74B49B] animate-pulse">Saving...</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Scholarship Deadlines</strong>
                <span className="text-[11px] text-slate-500">Alerts when target deadlines approach</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.notify_scholarship_deadlines}
                onChange={() => handleTogglePreference("notify_scholarship_deadlines")}
                className="w-4 h-4 accent-[#74B49B] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Flashcard Spaced Repetition</strong>
                <span className="text-[11px] text-slate-500">Reminders when cards enter review window</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.notify_flashcard_reviews}
                onChange={() => handleTogglePreference("notify_flashcard_reviews")}
                className="w-4 h-4 accent-[#74B49B] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Saved Learning Reminders</strong>
                <span className="text-[11px] text-slate-500">Gentle prompts for bookmarked courses</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.notify_learning_reminders}
                onChange={() => handleTogglePreference("notify_learning_reminders")}
                className="w-4 h-4 accent-[#74B49B] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Diagnostic Tests</strong>
                <span className="text-[11px] text-slate-500">Recommendations for knowledge check-ins</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.notify_test_reminders}
                onChange={() => handleTogglePreference("notify_test_reminders")}
                className="w-4 h-4 accent-[#74B49B] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Mentorship Updates</strong>
                <span className="text-[11px] text-slate-500">Consultation responses and application status</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.notify_mentorship_updates}
                onChange={() => handleTogglePreference("notify_mentorship_updates")}
                className="w-4 h-4 accent-[#74B49B] rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 cursor-pointer">
              <div>
                <strong className="text-slate-800 block">Community Activity</strong>
                <span className="text-[11px] text-slate-500">Replies and questions in your subjects</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.notify_community_activity}
                onChange={() => handleTogglePreference("notify_community_activity")}
                className="w-4 h-4 accent-[#74B49B] rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "all"
              ? "bg-[#74B49B] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Alerts ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("unread")}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "unread"
              ? "bg-[#5C899D] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setActiveTab("deadlines")}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "deadlines"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Deadlines
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">All caught up!</h3>
          <p className="text-xs text-slate-500">
            No active notifications in this view. Keep pursuing your academic goals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const config = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.saved_learning_reminder;
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.is_read
                    ? "bg-white border-slate-200/80 opacity-80 hover:opacity-100"
                    : "bg-white border-[#74B49B]/50 shadow-2xs ring-1 ring-[#74B49B]/20"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${config.bg} ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                        {config.label}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#74B49B]" />
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800">{notif.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href={notif.target_url}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Open <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-xl transition cursor-pointer"
                      title="Mark as Read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-xl transition cursor-pointer"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}