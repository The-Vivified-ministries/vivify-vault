"use client";

import { useState } from "react";
import {
  askChat,
  rateChat,
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
  const [page, setPage] = useState(1);
  const [chatRating, setChatRating] = useState<number | null>(null);
  const [ratingError, setRatingError] = useState(false);

  const pageSize = 10;
  const totalItems = searchResults ? searchResults.length : response ? response.results.length : 0;
  const totalPages = totalItems > 0 ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setSearchResults(null);
    setPage(1);
    setChatRating(null);
    setRatingError(false);

    try {
      if (mode === "search") {
        const results = await searchSermons(query, 50);
        setSearchResults(results);
      } else {
        const res = await askChat(query, 50);
        setResponse(res);
      }
    } catch {
      setError("Something went wrong reaching the Vault Keeper. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChatRating(rating: number) {
    if (!response) return;
    setChatRating(rating);
    setRatingError(false);
    try {
      await rateChat(response.query_id, rating);
    } catch {
      setRatingError(true);
    }
  }

  function handleClearResults() {
    setSearchResults(null);
    setError(null);
    setPage(1);
  }

  return (
    <section
      id="ask-the-vault"
      className="relative w-full bg-vault-charcoal py-16 px-6 md:px-12"
    >
      <div className="mx-auto max-w-screen-2xl px-6">
        <span className="inline-block rounded-full bg-vault-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-vault-charcoal">
          Ask the Vault
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white">
          Not sure which sermon you need?
        </h2>
        <p className="mt-2 text-vault-stone text-lg">
          Tell us what you&apos;re going through or what you&apos;re curious about —
          the Vault will surface the sermon that fits.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-2">
            <p className="text-xs text-gray-400">
              We anonymously record your entries to help us improve.
            </p>
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
              ? "Chat mode: Describe what you are facing and we'll point you to the right sermon."
              : "Search mode: Search by sermon title, preacher or scripture."}
          </p>
        </div>

        <form onSubmit={handleAsk} className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "chat"
                ? "e.g. I'm anxious about the future and don't know how to trust God"
                : "e.g. Dauntless or Romans or Amara Jonathan"
            }
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
          <>
            {searchResults.length === 0 ? (
              <p className="mt-6 text-gray-300">
                No sermons available for this, but we have noted your search and will consider it.
              </p>
            ) : (
              <>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-300">
                    Showing {Math.min((page - 1) * pageSize + 1, searchResults.length)}-
                    {Math.min(page * pageSize, searchResults.length)} of {searchResults.length} sermons.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClearResults}
                      className="rounded-full bg-vault-stone px-4 py-2 text-sm font-semibold text-vault-charcoal hover:bg-vault-lavender"
                    >
                      Clear results
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-full bg-vault-stone px-3 py-2 text-sm font-semibold text-vault-charcoal disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-sm text-gray-300">
                        Page {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-full bg-vault-stone px-3 py-2 text-sm font-semibold text-vault-charcoal disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {searchResults.slice((page - 1) * pageSize, page * pageSize).map((sermon) => (
                    <SermonCard key={sermon.id} sermon={sermon} />
                  ))}
                </div>
              </>
            )}
          </>
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

            <div className="mt-3 flex items-center gap-1">
              <span className="mr-1 text-xs text-gray-500">Rate this response</span>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  aria-label={`Rate this response ${rating} out of 5 stars`}
                  aria-pressed={chatRating === rating}
                  onClick={() => void handleChatRating(rating)}
                  className={`grid size-8 place-items-center rounded text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-vault-magenta ${
                    chatRating !== null && rating <= chatRating
                      ? "text-vault-gold"
                      : "text-gray-400 hover:text-vault-gold"
                  }`}
                >
                  ★
                </button>
              ))}
              {ratingError && (
                <span role="status" className="ml-2 text-xs text-gray-500">
                  Rating could not be saved.
                </span>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Showing {Math.min((page - 1) * pageSize + 1, response.results.length)}-
                {Math.min(page * pageSize, response.results.length)} of {response.results.length} sermons.
              </p>
              <div className="mt-4 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {response.results
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((r) => (
                      <SermonCard key={r.id} sermon={r.sermon} />
                    ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      p === page ? "bg-vault-magenta text-white" : "bg-vault-stone text-vault-charcoal"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
