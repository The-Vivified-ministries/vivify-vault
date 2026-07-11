"use client";

import { useState } from "react";
import { askChat, ChatResponse } from "@/lib/api";

export default function ChatSection() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await askChat(query);
      setResponse(res);
    } catch {
      setError("Something went wrong reaching the Vault Keeper. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="ask-the-vault"
      className="relative w-full bg-vault-charcoal py-16 px-6 md:px-12"
    >
      <div className="mx-auto max-w-3xl">
        <span className="inline-block rounded-full bg-vault-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-vault-charcoal">
          Ask the Vault
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white">
          Not sure which sermon you need?
        </h2>
        <p className="mt-2 text-vault-stone text-lg">
          Tell us what you're going through or what you're curious about —
          the Vault will surface the sermon that fits.
        </p>

        <form onSubmit={handleAsk} className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. I'm anxious about the future and don't know how to trust God"
            className="flex-1 rounded-xl px-5 py-4 text-vault-charcoal placeholder:text-gray-500 bg-white focus:outline-none focus:ring-4 focus:ring-vault-gold"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-vault-magenta px-8 py-4 font-bold text-white hover:bg-vault-magentaDark transition-colors disabled:opacity-60"
          >
            {loading ? "Searching…" : "Ask"}
          </button>
        </form>

        {error && <p className="mt-4 text-red-300">{error}</p>}

        {response && (
          <div className="mt-8 rounded-2xl bg-vault-cream p-6">
            <p className="text-vault-charcoal whitespace-pre-line leading-relaxed">
              {response.answer}
            </p>

            {!response.llm_used && (
              <p className="mt-3 text-xs text-gray-500 italic">
                Showing direct matches (smart answers are temporarily paused).
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {response.results.map((r) => (
                <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-vault-magenta">
                    {r.sermon.categories.join(" • ")}
                  </p>
                  <p className="mt-1 font-bold text-vault-charcoal">
                    {r.sermon.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {r.sermon.description}
                  </p>
                  <div className="mt-2 flex gap-3">
                    {r.sermon.spotify_link && (
                      <a
                        href={r.sermon.spotify_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-vault-magenta hover:underline"
                      >
                        Spotify
                      </a>
                    )}
                    {r.sermon.apple_music_link && (
                      <a
                        href={r.sermon.apple_music_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-vault-magenta hover:underline"
                      >
                        Apple Music
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
