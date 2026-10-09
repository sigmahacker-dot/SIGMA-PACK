// Tools library page: search + category filter chips + full tool grid.

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import type { Tool } from "@/components/types";

function ToolsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "";

  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);

  const fetchTools = useCallback(async (query: string, cat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/tools?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list: Tool[] = data.tools ?? [];
        setTools(list);
        // Derive category list from the unfiltered set once
        setCategories((prev) => {
          if (prev.length > 0 || query || cat) return prev;
          return Array.from(new Set(list.map((t) => t.category))).sort();
        });
      }
    } catch {
      /* tools api not ready yet */
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchTools(q, category), 350);
    return () => clearTimeout(t);
  }, [q, category, fetchTools]);

  const clearFilters = () => {
    setQ("");
    setCategory("");
  };

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          All <span className="text-gradient-orange">Tools</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Browse the full Sigma Pack library. Search by name or filter by category.
        </p>

        {/* Search */}
        <div className="mt-6">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools… (e.g. video, design, chat)"
            className="input-dark"
          />
        </div>

        {/* Category chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              category === "" ? "bg-brand text-white" : "border border-white/10 text-slate-300 hover:border-brand/50"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === category ? "" : c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                category === c ? "bg-brand text-white" : "border border-white/10 text-slate-300 hover:border-brand/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="mt-6 text-sm text-slate-500">
          {loading ? "Loading…" : `${tools.length} tool${tools.length === 1 ? "" : "s"} found`}
          {(q || category) && (
            <button onClick={clearFilters} className="ml-3 font-semibold text-brand-light hover:underline">
              Clear filters
            </button>
          )}
        </p>

        {/* Grid */}
        <div className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="glass h-36 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : tools.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-300">No tools match your search.</p>
              <p className="mt-1 text-sm text-slate-500">Try a different keyword or category.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy" />}>
      <ToolsContent />
    </Suspense>
  );
}
