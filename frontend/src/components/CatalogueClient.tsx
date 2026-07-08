"use client";

import { useState } from "react";
import { Sermon } from "@/lib/api";
import SermonCard from "@/components/SermonCard";
import CategoryFilter from "@/components/CategoryFilter";

export default function CatalogueClient({
  sermons,
  categories,
}: {
  sermons: Sermon[];
  categories: string[];
}) {
  const [active, setActive] = useState<string | null>(null);

  // Filtering happens entirely client-side against data that was already
  // fetched (and cached) server-side — switching categories never
  // touches the backend, so it's instant even if the backend is cold.
  const visible = active
    ? sermons.filter((s) => s.category.toLowerCase() === active.toLowerCase())
    : sermons;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:px-12">
      <h2 className="text-2xl font-bold text-vault-charcoal mb-6">
        Or browse by topic
      </h2>
      <CategoryFilter categories={categories} active={active} onSelect={setActive} />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sermons.length === 0 ? (
          <p className="text-gray-500">
            The catalogue is temporarily unavailable — please check back shortly.
          </p>
        ) : visible.length === 0 ? (
          <p className="text-gray-500">No sermons found in this category yet.</p>
        ) : (
          visible.map((s) => <SermonCard key={s.link} sermon={s} />)
        )}
      </div>
    </section>
  );
}
