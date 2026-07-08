const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export type Sermon = {
  title: string;
  category: string;
  speaker?: string | null;
  link: string;
  description: string;
};

export type SearchResult = {
  id: string;
  score: number;
  sermon: Sermon;
};

export type ChatResponse = {
  answer: string;
  llm_used: boolean;
  results: SearchResult[];
};

export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function getSermons(category?: string): Promise<Sermon[]> {
  const url = category
    ? `${API_URL}/sermons?category=${encodeURIComponent(category)}`
    : `${API_URL}/sermons`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load sermons");
  return res.json();
}

// --- Server-side, cached versions used by the homepage server component ---
// These are what decouple plain catalogue browsing from live backend
// availability: Next.js serves the last successfully cached response
// instantly and only re-fetches in the background every `revalidate`
// seconds (ISR). A cold or briefly-down backend never blocks a visitor
// who's just browsing — they see the last-known-good catalogue.
//
// Chat intentionally does NOT use this pattern — a live round trip is
// expected there, since the answer depends on the specific question.

export async function getCategoriesCached(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getSermonsCached(): Promise<Sermon[]> {
  try {
    const res = await fetch(`${API_URL}/sermons`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function askChat(query: string): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top_k: 3 }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}
