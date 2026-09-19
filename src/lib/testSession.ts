"use client";

const SESSION_KEY = "lily_student_session_id";
const DRAFT_PREFIX = "lily_active_test_";

export function getSessionId(): string {
  if (typeof window === "undefined") return "guest";
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function saveActiveDraft(testId: string, answers: Record<string, string>, elapsedSeconds: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${DRAFT_PREFIX}${testId}`,
      JSON.stringify({ answers, elapsedSeconds, timestamp: Date.now() })
    );
  } catch (e) {
    console.error("Draft save error", e);
  }
}

export function loadActiveDraft(testId: string): { answers: Record<string, string>; elapsedSeconds: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${testId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveDraft(testId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${DRAFT_PREFIX}${testId}`);
}