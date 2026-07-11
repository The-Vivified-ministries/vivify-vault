import { getCategoriesCached } from "@/lib/api";
import ChatSection from "@/components/ChatSection";
import BrowseClient from "@/components/BrowseClient";

export default async function Home() {
  const categories = await getCategoriesCached();

  return (
    <main className="min-h-screen bg-vault-cream">
      <section className="relative overflow-hidden bg-vault-magenta px-6 py-16 text-center text-white md:px-12">
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <img
            src="/tvc-logo.png"
            alt=""
            className="h-80 w-80 object-contain md:h-[20rem] md:w-[20rem] -mt-4 md:-mt-8 drop-shadow-2xl"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold md:text-5xl">The Vivify Vault</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-vault-stone">
            Your go-to resource for every sermon we've taught — browse by
            topic, or just ask.
          </p>
          <a
            href="#ask-the-vault"
            className="mt-6 inline-block rounded-xl bg-vault-gold px-6 py-3 font-bold text-vault-charcoal transition hover:brightness-95"
          >
            Ask the Vault ↓
          </a>
        </div>
      </section>

      <ChatSection />

      <BrowseClient categories={categories} />
    </main>
  );
}
