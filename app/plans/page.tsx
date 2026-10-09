// Plans page: choose a plan → create order if logged in, else send to signup.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlanCard from "@/components/PlanCard";
import type { Plan } from "@/components/types";

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState<string | number | null>(null);
  const [error, setError] = useState("");

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

  const onChoose = async (plan: Plan) => {
    setError("");
    setChoosing(plan.id);
    try {
      // Check auth first
      const me = await fetch("/api/auth/me", { cache: "no-store" });
      if (!me.ok) {
        router.push(`/signup?plan=${plan.id}`);
        return;
      }
      // Create the order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create your order. Please try again.");
        return;
      }
      router.push(`/orders/${data.order.id}`);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setChoosing(null);
    }
  };

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Choose Your <span className="text-gradient-orange">Plan</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Every plan unlocks all 100+ tools. Pay with JazzCash or Easypaisa, send the receipt on
            WhatsApp, and we activate your subscription.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass h-80 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {plans.map((p, i) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  highlight={i === 1 && plans.length > 2}
                  onChoose={onChoose}
                  loading={choosing === p.id}
                />
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-300">Plans are being loaded.</p>
              <p className="mt-1 text-sm text-slate-500">Please refresh the page in a moment.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
