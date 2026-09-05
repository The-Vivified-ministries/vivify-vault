const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export type AdminSermon = {
  id: number;
  title: string;
  year: number | null;
  categories: string[];
  subcategories: string[];
  description: string;
  spotify_link: string | null;
  apple_music_link: string | null;
};

export type AdminSermonPayload = {
  id: number | null;
  title: string;
  year: number | null;
  categories: string[];
  subcategories: string[];
  description: string;
  spotify_link: string | null;
  apple_music_link: string | null;
};

export async function getAdminSermons(adminKey: string): Promise<AdminSermon[]> {
  const res = await fetch(`${API_URL}/admin/sermons`, {
    headers: { "X-Admin-Key": adminKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Unable to fetch admin sermons");
  }
  return res.json();
}

export async function saveAdminSermon(
  adminKey: string,
  userName: string,
  sermon: AdminSermonPayload
): Promise<AdminSermon> {
  const res = await fetch(`${API_URL}/admin/sermons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body: JSON.stringify({
      user_name: userName,
      sermon,
    }),
  });
  if (!res.ok) {
    throw new Error("Unable to save sermon");
  }
  return res.json();
}

export async function bulkAddAdminSermons(
  adminKey: string,
  userName: string,
  csvText: string
): Promise<AdminSermon[]> {
  const res = await fetch(`${API_URL}/admin/sermons/bulk-add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body: JSON.stringify({ user_name: userName, csv_text: csvText }),
  });
  if (!res.ok) {
    throw new Error("Unable to bulk add sermons");
  }
  return res.json();
}
