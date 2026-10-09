// Stats strip below the hero: tools / buyers / active subscriptions.

"use client";

import { useEffect, useState } from "react";
import type { SiteStats } from "../types";

export default function StatsStrip() {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (alive && res.ok) setStats(await res.json());
      } catch {
        /* stats api not ready yet */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const items = [
    { value: stats ? `${stats.tools_count}+` : "100+", label: "Premium AI Tools" },
    { value: stats ? stats.buyers_count.toLocaleString("en-PK") : "—", label: "Happy Buyers" },
    { value: stats ? stats.active_subs.toLocaleString("en-PK") : "—", label: "Active Subscriptions" },
    { value: "24/7", label: "WhatsApp Support" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="glass grid grid-cols-2 gap-4 rounded-3xl p-6 sm:grid-cols-4 sm:p-8">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <div className="text-3xl font-extrabold text-gradient-orange sm:text-4xl">{it.value}</div>
            <div className="mt-1 text-sm text-slate-400">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
