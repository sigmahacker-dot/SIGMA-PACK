// FAQ accordion (client) — all copy original, in our own words.

"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What is Sigma Pack?",
    a: "Sigma Pack is a subscription bundle that gives you access to 100+ premium AI tools — video editors, image generators, writing assistants, chatbots, voice tools, marketing utilities and more — all under one plan. Instead of paying for each tool separately, you pay once and get everything.",
  },
  {
    q: "How do I pay for a plan?",
    a: "After choosing a plan, you pay with JazzCash or Easypaisa to the numbers shown on the order page. Then send the payment screenshot on our WhatsApp. Our team verifies it and activates your subscription — usually the same day.",
  },
  {
    q: "How do I get the tool logins?",
    a: "Once your subscription is active, open your Dashboard and go to “My Tools”. Every tool that includes login details has a “Reveal login” button — tap it to see the username and password. Keep those credentials private.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Subscriptions run for the full plan duration you bought (1 month, 6 months or 1 year) and access simply ends when it expires — there is nothing to cancel. If you paid for a plan by mistake before activation, message us on WhatsApp and we will sort it out.",
  },
  {
    q: "Is this official access from the tool companies?",
    a: "Honestly: no. Sigma Pack is a shared bundle service, not an official reseller of these tools. You get working access to each tool through shared accounts we maintain, at a fraction of the official prices. Some tools may have usage limits during peak hours.",
  },
  {
    q: "What if a tool stops working?",
    a: "It happens rarely, but shared logins can get reset or throttled. Just message us on WhatsApp and we replace the credentials or swap the tool. Your subscription stays active while we fix it.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="glass overflow-hidden rounded-2xl">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-bold text-white sm:text-base">{f.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="#FF6A00"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <path d="M4 7l5 5 5-5" />
              </svg>
            </button>
            {isOpen && <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
