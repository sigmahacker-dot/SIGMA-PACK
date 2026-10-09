// Plans section on the home page: all plans from /api/plans, CTA to /plans.

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import PlanCard from "../PlanCard";
import type { Plan } from "../types";

export default function PlansSection() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/plans", { cache: "no-store" });
        if (alive && res.ok) {
          const data = await res.json();
          const list: Plan[] = data.plans ?? [];
          setPlans(list.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)));
        }
      } catch {
        /* plans api not ready yet */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="plans" className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
          Simple <span className="text-gradient-orange">Pricing</span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
          One subscription. Every tool. Pay with JazzCash or Easypaisa, send the receipt on WhatsApp,
          and we activate you.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass h-80 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : plans.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {plans.map((p, i) => (
              <PlanCard key={p.id} plan={p} highlight={i === 1 && plans.length > 2} onChoose={() => router.push("/plans")} loading={false} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/plans" className="btn-primary">
              View All Plans
            </Link>
          </div>
        </>
      ) : (
        <p className="glass rounded-2xl p-6 text-center text-sm text-slate-400">
          Plans are being loaded — check back shortly.
        </p>
      )}
    </section>
  );
}
