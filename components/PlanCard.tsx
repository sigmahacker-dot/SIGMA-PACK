// Pricing plan card: name, price, months, feature list, CTA button.

import type { Plan } from "./types";
import { formatRs } from "./types";

interface PlanCardProps {
  plan: Plan;
  onChoose: (plan: Plan) => void;
  highlight?: boolean;
  loading?: boolean;
}

export default function PlanCard({ plan, onChoose, highlight = false, loading = false }: PlanCardProps) {
  return (
    <div
      className={`glass card-glow relative flex flex-col rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1 ${
        highlight ? "ring-2 ring-brand" : ""
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
      <p className="mt-1 text-sm text-slate-400">
        {plan.months === 1 ? "1 month" : plan.months === 12 ? "12 months (1 year)" : `${plan.months} months`} of
        access
      </p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-gradient-orange">{formatRs(plan.price_pkr)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Rs {(plan.price_pkr / Math.max(plan.months, 1)).toLocaleString("en-PK")} / month approx.
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#FF6A00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              aria-hidden
            >
              <path d="M3 8.5l3.2 3.2L13 5" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => onChoose(plan)} disabled={loading} className="btn-primary mt-6 w-full disabled:opacity-60">
        {loading ? "Please wait…" : "Choose Plan"}
      </button>
    </div>
  );
}
