const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export type Sermon = {
  id: number;
  title: string;
  year: number | null;
  categories: string[];
  subcategories: string[];
  description: string;
  spotify_link: string | null;
  apple_music_link: string | null;
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

// Server-side cached — used for the top-level category list on first
// paint, so it renders fast regardless of backend warmth.
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

export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${API_URL}/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

// Everything below is live/client-side — these only run once someone
// has actually drilled into a category, which is an interactive action
// where a brief load is expected (same reasoning as chat).

export async function getSubcategories(category: string): Promise<string[]> {
  const res = await fetch(
    `${API_URL}/categories/${encodeURIComponent(category)}/subcategories`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load subcategories");
  return res.json();
}

export async function getYears(): Promise<number[]> {
  const res = await fetch(`${API_URL}/years`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load years");
  return res.json();
}

export async function getSermons(params: {
  category: string;
  subcategory: string;
  year?: number;
}): Promise<Sermon[]> {
  const q = new URLSearchParams();
  q.set("category", params.category);
  q.set("subcategory", params.subcategory);
  if (params.year) q.set("year", String(params.year));
  const res = await fetch(`${API_URL}/sermons?${q.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load sermons");
  return res.json();
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
