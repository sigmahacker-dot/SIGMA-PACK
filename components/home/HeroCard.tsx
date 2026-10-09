// Hero right-side glass card: live stats + mini signup CTA.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteStats } from "../types";

export default function HeroCard() {
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
    { value: stats ? `${stats.tools_count}+` : "100+", label: "Premium AI tools" },
    { value: stats ? stats.buyers_count.toLocaleString("en-PK") : "—", label: "Happy buyers" },
    { value: "Rs 799", label: "Plans start from" },
  ];

  return (
    <div className="glass card-glow w-full rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-bold text-white">Everything AI. One pack.</h2>
      <p className="mt-1 text-sm text-slate-400">Live stats from the Sigma Pack vault:</p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <div className="text-xl font-extrabold text-gradient-orange sm:text-2xl">{it.value}</div>
            <div className="mt-1 text-[11px] leading-tight text-slate-400">{it.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/10 p-4">
        <p className="text-sm font-semibold text-white">Create your free account</p>
        <p className="mt-1 text-xs text-slate-400">
          Sign up free, pick a plan, pay with JazzCash or Easypaisa — tools unlocked after verification.
        </p>
        <Link href="/signup" className="btn-primary mt-3 w-full text-sm">
          Get Started — It&apos;s Free
        </Link>
        <p className="mt-2 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-light hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
