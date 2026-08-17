"use client";

import { useEffect, useState } from "react";
import {
  getCategories,
  getSubcategories,
  getSermons,
  getYears,
  Sermon,
} from "@/lib/api";
import SermonCard from "@/components/SermonCard";

export default function BrowseClient({ categories }: { categories: string[] }) {
  const [categoryOptions, setCategoryOptions] = useState<string[]>(categories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    setCategoryOptions(categories);
  }, [categories]);

  useEffect(() => {
    if (categories.length > 0) return;

    let cancelled = false;

    const refreshCategories = async () => {
      setLoadingCategories(true);
      try {
        const next = await getCategories();
        if (!cancelled) setCategoryOptions(next);
      } catch {
        if (!cancelled) setCategoryOptions([]);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };

    void refreshCategories();
    const timer = window.setInterval(() => {
      void refreshCategories();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [categories.length]);

  useEffect(() => {
    getYears().then(setYears).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory(null);
      return;
    }
    setSelectedSubcategory(null);
    getSubcategories(selectedCategory).then(setSubcategories).catch(() => {});
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory || !selectedSubcategory) {
      setSermons([]);
      return;
    }
    setLoading(true);
    getSermons({
      category: selectedCategory,
      subcategory: selectedSubcategory,
      year: selectedYear ?? undefined,
    })
      .then(setSermons)
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedSubcategory, selectedYear]);

  return (
    <section className="mx-auto max-w-screen-2xl px-6 py-16 md:px-12">
      <h2 className="text-2xl font-bold text-vault-charcoal mb-2">
        Browse by topic
      </h2>

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`font-semibold ${
            !selectedCategory ? "text-vault-magenta" : "text-gray-500 hover:text-vault-magenta"
          }`}
        >
          All Categories
        </button>
        {selectedCategory && (
          <>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => setSelectedSubcategory(null)}
              className={`font-semibold ${
                !selectedSubcategory ? "text-vault-magenta" : "text-gray-500 hover:text-vault-magenta"
              }`}
            >
              {selectedCategory}
            </button>
          </>
        )}
        {selectedSubcategory && (
          <>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-vault-magenta">{selectedSubcategory}</span>
          </>
        )}
      </div>

      {/* Year toggle — appears once you're viewing actual sermons */}
      {selectedSubcategory && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedYear(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              selectedYear === null
                ? "bg-vault-charcoal text-white"
                : "bg-vault-stone text-vault-charcoal hover:bg-vault-lavender"
            }`}
          >
            All years
          </button>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                selectedYear === y
                  ? "bg-vault-charcoal text-white"
                  : "bg-vault-stone text-vault-charcoal hover:bg-vault-lavender"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* Level 1: Categories */}
      {!selectedCategory && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loadingCategories ? (
            <p className="text-gray-500">Loading categories…</p>
          ) : categoryOptions.length === 0 ? (
            <div className="col-span-full space-y-3">
              <p className="text-gray-500">
                Categories are temporarily unavailable — please check back shortly.
              </p>
              <button
                onClick={() => {
                  setLoadingCategories(true);
                  getCategories()
                    .then(setCategoryOptions)
                    .catch(() => setCategoryOptions([]))
                    .finally(() => setLoadingCategories(false));
                }}
                className="rounded-full bg-vault-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-vault-magentaDark"
              >
                Retry loading
              </button>
            </div>
          ) : (
            categoryOptions.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className="rounded-xl bg-vault-magenta px-6 py-10 text-lg font-bold text-white hover:bg-vault-magentaDark transition-colors text-center"
              >
                {c}
              </button>
            ))
          )}
        </div>
      )}

      {/* Level 2: Subcategories */}
      {selectedCategory && !selectedSubcategory && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {subcategories.length === 0 ? (
            <p className="text-gray-500">Loading topics…</p>
          ) : (
            subcategories.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubcategory(s)}
                className="rounded-xl bg-vault-lavender px-6 py-6 font-bold text-vault-charcoal hover:brightness-95 transition-colors text-center"
              >
                {s}
              </button>
            ))
          )}
        </div>
      )}

      {/* Level 3: Sermons */}
      {selectedSubcategory && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loading ? (
            <p className="text-gray-500">Loading sermons…</p>
          ) : sermons.length === 0 ? (
            <p className="text-gray-500">No sermons found for this filter yet.</p>
          ) : (
            sermons.map((s) => <SermonCard key={s.id} sermon={s} />)
          )}
        </div>
      )}
    </section>
  );
}
