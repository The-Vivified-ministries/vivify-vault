"use client";

import { useState } from "react";
import {
  askChat,
  searchSermons,
  ChatResponse,
  Sermon,
} from "@/lib/api";
import SermonCard from "@/components/SermonCard";

export default function ChatSection() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"chat" | "search">("chat");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [searchResults, setSearchResults] = useState<Sermon[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setSearchResults(null);

    try {
      if (mode === "search") {
        const results = await searchSermons(query, 3);
        setSearchResults(results);
      } else {
        const res = await askChat(query);
        setResponse(res);
      }
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "chat"
                  ? "bg-vault-magenta text-white"
                  : "bg-vault-stone text-vault-charcoal hover:bg-vault-lavender"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMode("search")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "search"
                  ? "bg-vault-magenta text-white"
                  : "bg-vault-stone text-vault-charcoal hover:bg-vault-lavender"
              }`}
            >
              Search
            </button>
          </div>
          <p
            className="text-xs text-gray-400"
            title={
              mode === "chat"
                ? "Chat will use database search and then refine the answer with Groq."
                : "Search will return direct sermon title matches instead of an AI-polished response."
            }
          >
            {mode === "chat"
              ? "Chat mode: refined recommendation."
              : "Search mode: direct sermon title match search."}
          </p>
        </div>

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

        {mode === "search" && searchResults && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {searchResults.map((sermon) => (
              <SermonCard key={sermon.id} sermon={sermon} />
            ))}
          </div>
        )}

        {mode === "chat" && response && (
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
                  <div
                    className="mt-1 text-sm text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: r.sermon.description }}
                  />
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
