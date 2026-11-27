import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export interface PublicPulseData {
  totalLearners: number;
  totalCourses: number;
  totalDecks: number;
  totalFlashcards: number;
  totalScholarships: number;
  communityDiscussions: number;
  totalTestAttempts: number;
  testsToday: number;
  activeSessionsToday: number;
  topSubjects: { name: string; count: number }[];
  updatedAt: string;
}

type CountClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }
    ) => {
      gte?: (
        col: string,
        val: string
      ) => PromiseLike<{ count: number | null; error: unknown }>;
      eq?: (
        col: string,
        val: string
      ) => PromiseLike<{ count: number | null; error: unknown }>;
    } & PromiseLike<{ count: number | null; error: unknown }>;
  };
};

async function safeExactCount(
  supabase: CountClient,
  table: string,
  filter?: { type: "gte" | "eq"; column: string; value: string }
): Promise<number> {
  try {
    const base = supabase.from(table).select("*", { count: "exact", head: true });
    const res =
      filter?.type === "gte" && base.gte
        ? await base.gte(filter.column, filter.value)
        : filter?.type === "eq" && base.eq
        ? await base.eq(filter.column, filter.value)
        : await base;

    if (res.error || typeof res.count !== "number") return 0;
    return res.count;
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required to view platform pulse." },
      { status: 401 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: "Invalid or expired session. Please sign in." },
      { status: 401 }
    );
  }

  const countClient = supabase as unknown as CountClient;
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayStartIso = `${todayDateStr}T00:00:00.000Z`;

  const [
    totalLearners,
    totalCourses,
    totalDecks,
    totalFlashcards,
    totalScholarships,
    forumPostsCount,
    forumThreadsCount,
    totalTestAttempts,
    testsToday,
    activeSessionsToday,
    decksSubjectsRes,
  ] = await Promise.all([
    safeExactCount(countClient, "profiles"),
    safeExactCount(countClient, "courses"),
    safeExactCount(countClient, "flashcard_decks"),
    safeExactCount(countClient, "flashcards"),
    safeExactCount(countClient, "scholarships"),
    safeExactCount(countClient, "forum_posts"),
    safeExactCount(countClient, "forum_threads"),
    safeExactCount(countClient, "test_attempts"),
    safeExactCount(countClient, "test_attempts", {
      type: "gte",
      column: "completed_at",
      value: todayStartIso,
    }),
    safeExactCount(countClient, "user_activity_log", {
      type: "eq",
      column: "activity_date",
      value: todayDateStr,
    }),
    supabase.from("flashcard_decks").select("subject_name").limit(200),
  ]);

  const subjectCounts = new Map<string, number>();
  if (Array.isArray(decksSubjectsRes.data)) {
    for (const row of decksSubjectsRes.data as { subject_name?: string | null }[]) {
      const clean = (row.subject_name || "").trim();
      if (!clean || clean.toLowerCase() === "general") continue;
      subjectCounts.set(clean, (subjectCounts.get(clean) || 0) + 1);
    }
  }

  const topSubjects = Array.from(subjectCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const payload: PublicPulseData = {
    totalLearners,
    totalCourses,
    totalDecks,
    totalFlashcards,
    totalScholarships,
    communityDiscussions: Math.max(forumPostsCount, forumThreadsCount),
    totalTestAttempts,
    testsToday,
    activeSessionsToday,
    topSubjects,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload);
}