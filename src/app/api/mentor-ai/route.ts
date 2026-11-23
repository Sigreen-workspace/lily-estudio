import { NextRequest, NextResponse } from "next/server";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface MentorRequestBody {
  message?: string;
  history?: ChatTurn[];
  selectedModel?: string;
  courseContext?: {
    title?: string;
    level?: string;
    track?: string;
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSystemInstruction(courseContext?: MentorRequestBody["courseContext"]) {
  const contextLine = courseContext?.title
    ? `Current Course Context: "${courseContext.title}" (${courseContext.level || "All Levels"}, ${courseContext.track || "General"}).`
    : "General Academic Context (School, College/University, Competitive Exams, Study Abroad).";

  return [
    "You are Mentor AI on Lily Estudio, a calm, clear, and structured academic mentor for students.",
    contextLine,
    "Explain concepts step-by-step, verify assumptions, break down formulas or derivations clearly, and end with a short practice check or next study step when helpful.",
    "Keep responses concise, accurate, and easy to read.",
  ].join(" ");
}

async function tryGemini(
  apiKey: string,
  model: string,
  systemInstruction: string,
  recentHistory: ChatTurn[],
  promptText: string
): Promise<string | null> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const contents = [
    ...recentHistory.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    {
      role: "user",
      parts: [{ text: promptText }],
    },
  ];

  const payload = JSON.stringify({
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: payload,
    });

    if (res.ok) {
      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || "")
          .join("")
          .trim() || "";
      if (text) return text;
    }

    if (res.status === 503 || res.status === 429) {
      await sleep(500 * attempt);
      continue;
    }

    break;
  }

  return null;
}

async function tryOpenAiCompatibleProvider(options: {
  url: string;
  apiKey: string;
  model: string;
  systemInstruction: string;
  recentHistory: ChatTurn[];
  promptText: string;
  extraHeaders?: Record<string, string>;
}): Promise<string | null> {
  const messages = [
    { role: "system", content: options.systemInstruction },
    ...options.recentHistory.map((turn) => ({
      role: turn.role === "assistant" ? "assistant" : "user",
      content: turn.content,
    })),
    { role: "user", content: options.promptText },
  ];

  const res = await fetch(options.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
      ...(options.extraHeaders || {}),
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MentorRequestBody;
    const promptText = body.message?.trim();

    if (!promptText) {
      return NextResponse.json(
        { error: "Please enter a question or topic for Mentor AI." },
        { status: 400 }
      );
    }

    const systemInstruction = buildSystemInstruction(body.courseContext);
    const recentHistory = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const chosen = (body.selectedModel || "auto").trim();

    const geminiKey = process.env.GEMINI_API_KEY;
    const defaultGeminiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const groqKey = process.env.GROQ_API_KEY;
    const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openRouterModel = process.env.OPENROUTER_MODEL || "openrouter/free";

    const runGemini = async (modelName: string) => {
      if (!geminiKey) return null;
      const reply = await tryGemini(
        geminiKey,
        modelName,
        systemInstruction,
        recentHistory,
        promptText
      );
      return reply ? { reply, provider: "gemini", model: modelName } : null;
    };

    const runGroq = async (modelName: string = groqModel) => {
      if (!groqKey) return null;
      const reply = await tryOpenAiCompatibleProvider({
        url: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: groqKey,
        model: modelName,
        systemInstruction,
        recentHistory,
        promptText,
      });
      return reply ? { reply, provider: "groq", model: modelName } : null;
    };

    const runOpenRouter = async (modelName: string = openRouterModel) => {
      if (!openRouterKey) return null;
      const reply = await tryOpenAiCompatibleProvider({
        url: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: openRouterKey,
        model: modelName,
        systemInstruction,
        recentHistory,
        promptText,
        extraHeaders: {
          "HTTP-Referer": "https://www.lilyestudio.com",
          "X-Title": "Lily Estudio Mentor AI",
        },
      });
      return reply ? { reply, provider: "openrouter", model: modelName } : null;
    };

    // Explicit model selection first
    if (chosen.startsWith("gemini:")) {
      const targetModel = chosen.replace("gemini:", "") || defaultGeminiModel;
      const primary = await runGemini(targetModel);
      if (primary) return NextResponse.json(primary);
    } else if (chosen.startsWith("groq:")) {
      const targetModel = chosen.replace("groq:", "") || groqModel;
      const primary = await runGroq(targetModel);
      if (primary) return NextResponse.json(primary);
    } else if (chosen.startsWith("openrouter:")) {
      const targetModel = chosen.replace("openrouter:", "") || openRouterModel;
      const primary = await runOpenRouter(targetModel);
      if (primary) return NextResponse.json(primary);
    }

    // Auto / fallback sequence
    const autoGemini = await runGemini(defaultGeminiModel);
    if (autoGemini) return NextResponse.json(autoGemini);

    const autoGroq = await runGroq(groqModel);
    if (autoGroq) return NextResponse.json(autoGroq);

    const autoOpenRouter = await runOpenRouter(openRouterModel);
    if (autoOpenRouter) return NextResponse.json(autoOpenRouter);

    if (!geminiKey && !groqKey && !openRouterKey) {
      return NextResponse.json(
        { error: "No AI provider API key is configured on the server." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Selected or backup AI models are temporarily busy. Please try switching models or try again in a few seconds.",
      },
      { status: 503 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}