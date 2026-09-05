const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export async function runAdminSync(adminKey: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
  });

  if (!res.ok) {
    throw new Error("Unable to run admin sync");
  }
}
