import { getCategoriesCached, getSermonsCached } from "@/lib/api";
import ChatSection from "@/components/ChatSection";
import CatalogueClient from "@/components/CatalogueClient";

// This is now a Server Component (no "use client") — the catalogue data
// is fetched server-side at build/revalidate time (see the *_Cached
// functions in lib/api.ts), NOT on every visitor's page load. That means
// plain browsing is fast and independent of whether the Render backend
// happens to be cold at that exact moment.
//
// Only ChatSection stays a live, client-side call to the backend — which
// is correct, since a chat answer genuinely depends on a live request.

export default async function Home() {
  const [categories, sermons] = await Promise.all([
    getCategoriesCached(),
    getSermonsCached(),
  ]);

  return (
    <main className="min-h-screen bg-vault-cream">
      {/* Hero */}
      <section className="bg-vault-magenta px-6 py-16 text-center text-white md:px-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">The Vivify Vault</h1>
        <p className="mt-3 text-lg text-vault-stone max-w-xl mx-auto">
          Your go-to resource for every sermon we've taught — browse by
          topic, or just ask.
        </p>
        <a
          href="#ask-the-vault"
          className="mt-6 inline-block rounded-xl bg-vault-gold px-6 py-3 font-bold text-vault-charcoal hover:brightness-95 transition"
        >
          Ask the Vault ↓
        </a>
      </section>

      {/* Chat — the one part of this page that's genuinely live */}
      <ChatSection />

      {/* Browse catalogue — pre-fetched, cached, filtering is client-side only */}
      <CatalogueClient sermons={sermons} categories={categories} />
    </main>
  );
}
