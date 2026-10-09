// Tools preview grid on the home page: first 12 tools from /api/tools.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ToolCard from "../ToolCard";
import type { Tool } from "../types";

export default function ToolsPreview() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/tools", { cache: "no-store" });
        if (alive && res.ok) {
          const data = await res.json();
          setTools((data.tools ?? []).slice(0, 12));
        }
      } catch {
        /* tools api not ready yet */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Popular <span className="text-gradient-orange">Tools</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">A taste of the vault — the full library is much bigger.</p>
        </div>
        <Link href="/tools" className="hidden shrink-0 text-sm font-semibold text-brand-light hover:underline sm:block">
          View all tools →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass h-36 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : tools.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t, i) => (
            <ToolCard key={t.id} tool={t} index={i} />
          ))}
        </div>
      ) : (
        <p className="glass rounded-2xl p-6 text-center text-sm text-slate-400">
          Tool library is being loaded — check back shortly.
        </p>
      )}

      <div className="mt-6 text-center sm:hidden">
        <Link href="/tools" className="text-sm font-semibold text-brand-light hover:underline">
          View all tools →
        </Link>
      </div>
    </section>
  );
}
