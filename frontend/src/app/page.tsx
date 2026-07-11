import { getCategoriesCached } from "@/lib/api";
import ChatSection from "@/components/ChatSection";
import BrowseClient from "@/components/BrowseClient";

export default async function Home() {
  const categories = await getCategoriesCached();

  return (
    <main className="min-h-screen bg-vault-cream">
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

      <ChatSection />

      <BrowseClient categories={categories} />
    </main>
  );
}
