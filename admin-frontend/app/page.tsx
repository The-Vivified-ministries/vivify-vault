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
  const [sermons, setSermons] = useState<AdminSermon[]>([]);
  const [sermonPage, setSermonPage] = useState(1);
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
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(sermons.length / pageSize));
  const visibleSermons = sermons.slice((sermonPage - 1) * pageSize, sermonPage * pageSize);

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

  async function loadSermons() {
    if (!adminKey) {
      setStatus("Enter your admin key first.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const data = await getAdminSermons(adminKey);
      setSermons(data);
      setSermonPage(1);
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
      await loadSermons();
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
      await loadSermons();
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
    <main className="container py-10">
      <div className="rounded-3xl bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/30">
        <h1 className="text-4xl font-bold text-white">Vivify Vault Admin</h1>
        <p className="mt-3 text-slate-300">
          Use your admin secret and name to load sermons, edit metadata, or add new sermons directly.
        </p>
        {status?.includes("successfully") && (
          <div role="status" className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            {status}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
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
              className="text-xs font-semibold text-sky-300 hover:text-sky-200"
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
              onClick={loadSermons}
              disabled={loading || syncing}
              className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-base font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading…" : "Load sermons"}
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={loading || syncing}
              className="w-full rounded-2xl bg-slate-700 px-4 py-3 text-base font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Syncing…" : "Run sync"}
            </button>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Sermon list</p>
              <div className="mt-3 max-h-[420px] space-y-2 overflow-auto">
                {sermons.length === 0 ? (
                  <p className="text-slate-500">No sermons loaded yet.</p>
                ) : (
                    visibleSermons.map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="block w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm text-slate-200 hover:border-slate-600">
                        <div className="font-semibold">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.categories.join(" • ")} {item.year ? `· ${item.year}` : ""}</div>
                    </button>
                  ))
                )}
              </div>
              {sermons.length > pageSize && (
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>
                    Showing {(sermonPage - 1) * pageSize + 1}-{Math.min(sermonPage * pageSize, sermons.length)} of {sermons.length}
                  </span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSermonPage((page) => Math.max(1, page - 1))} disabled={sermonPage === 1} className="rounded-lg border border-slate-700 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                    <span className="px-1 py-1.5">{sermonPage} / {totalPages}</span>
                    <button type="button" onClick={() => setSermonPage((page) => Math.min(totalPages, page + 1))} disabled={sermonPage === totalPages} className="rounded-lg border border-slate-700 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
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

            {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}
