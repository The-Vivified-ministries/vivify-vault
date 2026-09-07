"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminSermon,
  AdminSermonPayload,
  bulkAddAdminSermons,
  getAdminSermons,
  saveAdminSermon,
} from "@/lib/api";
import { runAdminSync } from "@/lib/sync";

const emptySermon: AdminSermonPayload = {
  id: null,
  title: "",
  year: null,
  categories: [],
  subcategories: [],
  description: "",
  spotify_link: "",
  apple_music_link: "",
};

const csvTemplate = "title,year,categories,subcategories,description,spotify_link,apple_music_link\nExample sermon,2026,Real Life,Perspective,Short description,,\n";

export default function Page() {
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [userName, setUserName] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [sermons, setSermons] = useState<AdminSermon[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bulkCsv, setBulkCsv] = useState(csvTemplate);
  const [form, setForm] = useState<AdminSermonPayload>(emptySermon);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const selectedSermon = useMemo(
    () => sermons.find((item) => item.id === selectedId) ?? null,
    [sermons, selectedId]
  );
  useEffect(() => {
    if (selectedSermon) {
      setForm({
        id: selectedSermon.id,
        title: selectedSermon.title,
        year: selectedSermon.year,
        categories: selectedSermon.categories,
        subcategories: selectedSermon.subcategories,
        description: selectedSermon.description,
        spotify_link: selectedSermon.spotify_link ?? "",
        apple_music_link: selectedSermon.apple_music_link ?? "",
      });
    } else {
      setForm(emptySermon);
    }
  }, [selectedSermon]);

  async function loadSermons(title = searchTitle) {
    const trimmedTitle = title.trim();
    if (!adminKey || !trimmedTitle) {
      setSermons([]);
      setSelectedId(null);
      setStatus(!adminKey ? "Enter your admin key first." : "Enter a sermon title to search.");
      return;
    }
    setSearchTitle(trimmedTitle);
    setLoading(true);
    setStatus(null);
    try {
      const data = await getAdminSermons(adminKey, trimmedTitle);
      setSermons(data);
    } catch (error) {
      setStatus("Unable to load sermons. Check your admin key and backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!adminKey || !userName) {
      setStatus("Admin key and user name are required.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await saveAdminSermon(adminKey, userName, form);
      await loadSermons(form.title);
      setSelectedId(result.id);
      setStatus(`Sermon ${form.id ? "updated" : "created"} successfully.`);
    } catch (error) {
      setStatus("Could not save sermon. Check the input and admin key.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (!adminKey) {
      setStatus("Enter your admin key first.");
      return;
    }
    setSyncing(true);
    setStatus(null);
    try {
      await runAdminSync(adminKey);
      setStatus("Sync completed successfully.");
    } catch (error) {
      setStatus("Unable to run sync. Check your admin key and backend.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleBulkAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!adminKey || !userName || !bulkCsv.trim() || bulkCsv.trim().split("\n").length < 2) {
      setStatus("Admin key, user name, and at least one CSV row are required.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const added = await bulkAddAdminSermons(adminKey, userName, bulkCsv);
      if (searchTitle.trim()) {
        await loadSermons(searchTitle);
      } else {
        setSermons([]);
      }
      setStatus(`${added.length} sermons added successfully.`);
      setBulkCsv(csvTemplate);
    } catch (error) {
      setStatus("Could not add sermons. Check the CSV headers and values.");
    } finally {
      setLoading(false);
    }
  }

  function handleCsvFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkCsv(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([csvTemplate], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sermon-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container py-6 sm:py-10">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/30">
        <header className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-6 sm:px-8">
          <div className="flex items-center gap-3">
          <img
            src="/tvc-logo.png"
            alt="Vivify Vault logo"
            className="h-[150px] w-[150px] bg-transparent object-contain"
            style={{ width: "150px", height: "150px", minWidth: "150px", minHeight: "150px", maxWidth: "150px", maxHeight: "150px" }}
          />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Vivify Vault</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Admin workspace</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Manage sermon metadata, import new entries, and keep the vault ready for publishing.
          </p>
        </header>

        {status && (
          <div role="status" className={`mx-5 mt-5 rounded-xl border px-4 py-3 text-sm font-medium sm:mx-8 ${status.includes("successfully") ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}>
            {status}
          </div>
        )}

        <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access</p>
              <p className="mt-1 text-sm text-slate-400">Authenticate to manage the vault.</p>
            </div>
            <label className="block text-sm text-slate-300" htmlFor="adminKey">
              Admin key
            </label>
            <input
              id="adminKey"
              type={showAdminKey ? "text" : "password"}
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowAdminKey((visible) => !visible)}
              className="-mt-3 text-left text-xs font-semibold text-sky-300 hover:text-sky-200"
            >
              {showAdminKey ? "Hide admin key" : "Show admin key"}
            </button>

            <label className="block text-sm text-slate-300" htmlFor="userName">
              Your name
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
            />

            <button
              type="button"
              onClick={() => loadSermons()}
              disabled={loading || syncing}
              className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-base font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search sermons"}
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={loading || syncing}
              className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-base font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Syncing…" : "Run sync"}
            </button>

            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <label className="block text-sm font-semibold text-slate-200" htmlFor="searchTitle">
                Search by title
              </label>
              <input
                id="searchTitle"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="Enter part of a title"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
              />
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Library</p>
                  <p className="mt-1 text-lg font-semibold text-white">Sermons</p>
                </div>
                {sermons.length > 0 && <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">{sermons.length} loaded</span>}
              </div>
              <div className="mt-3 max-h-[420px] space-y-2 overflow-auto">
                {sermons.length === 0 ? (
                  <p className="text-slate-500">Search for a sermon title to see results.</p>
                ) : (
                    sermons.map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="block w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm text-slate-200 hover:border-slate-600">
                        <div className="font-semibold">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.categories.join(" • ")} {item.year ? `· ${item.year}` : ""}</div>
                    </button>
                  ))
                )}
              </div>
              <form onSubmit={handleBulkAdd} className="mt-5 space-y-3 border-t border-slate-800 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-200">Add many sermons</p>
                  <button type="button" onClick={downloadTemplate} className="text-xs font-semibold text-sky-300 hover:text-sky-200">Download template</button>
                </div>
                <p className="text-xs leading-5 text-slate-500">Upload a CSV or paste it below. Use quotes around descriptions or category lists that contain commas.</p>
                <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
                <textarea value={bulkCsv} onChange={(e) => setBulkCsv(e.target.value)} rows={8} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xs text-white" />
                <button type="submit" disabled={loading || syncing} className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Add sermons</button>
              </form>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
            <div className="border-b border-white/10 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Editor</p>
              <h2 className="mt-1 text-xl font-semibold text-white">{form.id ? "Edit sermon" : "New sermon"}</h2>
              <p className="mt-1 text-sm text-slate-400">Keep titles and taxonomy consistent for easier browsing.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-200" htmlFor="year">
                  Year
                </label>
                <input
                  id="year"
                  type="number"
                  value={form.year ?? ""}
                  onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200" htmlFor="categories">
                  Categories
                </label>
                <input
                  id="categories"
                  value={form.categories.join(", ")}
                  onChange={(e) => setForm({ ...form, categories: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) })}
                  placeholder="Separate with commas"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200" htmlFor="subcategories">
                Subcategories
              </label>
              <input
                id="subcategories"
                value={form.subcategories.join(", ")}
                onChange={(e) => setForm({ ...form, subcategories: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) })}
                placeholder="Separate with commas"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-200" htmlFor="spotify_link">
                  Spotify link
                </label>
                <input
                  id="spotify_link"
                  value={form.spotify_link ?? ""}
                  onChange={(e) => setForm({ ...form, spotify_link: e.target.value ?? null })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200" htmlFor="apple_music_link">
                  Apple Music link
                </label>
                <input
                  id="apple_music_link"
                  value={form.apple_music_link ?? ""}
                  onChange={(e) => setForm({ ...form, apple_music_link: e.target.value ?? null })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-violet-500 px-6 py-3 text-base font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving…" : "Save sermon"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setForm(emptySermon);
                  setStatus(null);
                }}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 text-base font-semibold text-slate-200 hover:border-slate-500"
              >
                New sermon
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  );
}
