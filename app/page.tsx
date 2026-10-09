// Sigma Pack home page — server component; dynamic blocks live in client components.
// All copy is original, written for Sigma Pack (not copied from any reference).

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroCard from "@/components/home/HeroCard";
import CategoryChips from "@/components/home/CategoryChips";
import StatsStrip from "@/components/home/StatsStrip";
import ToolsPreview from "@/components/home/ToolsPreview";
import PlansSection from "@/components/home/PlansSection";
import FaqAccordion from "@/components/home/FaqAccordion";

const STEPS = [
  {
    n: "1",
    title: "Pick a plan",
    text: "Choose the 1-month, 6-month or yearly plan that fits your budget.",
  },
  {
    n: "2",
    title: "Pay via JazzCash / Easypaisa",
    text: "Send the plan amount to the number shown on your order page.",
  },
  {
    n: "3",
    title: "Send the screenshot on WhatsApp",
    text: "Share your payment receipt on our WhatsApp so we can verify it fast.",
  },
  {
    n: "4",
    title: "We activate your subscription",
    text: "Our team verifies your payment and unlocks all 100+ tools on your dashboard.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <Navbar />

      {/* HERO */}
      <section className="hero-grid-bg">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2">
          {/* Left: headline + copy */}
          <div>
            <span className="inline-block rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-light">
              The all-in-one AI bundle
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              100+ Premium AI Tools. <span className="text-gradient-orange">One Subscription.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              Stop paying for ten different apps. Sigma Pack gives you one simple subscription that
              unlocks a whole library of premium AI tools — make videos, design graphics, write
              content, generate voices and run your online work like a studio, for less than the
              price of a single official plan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/tools" className="btn-primary">
                Browse Tools
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-slate-100 transition-colors hover:border-brand/60 hover:text-brand-light"
              >
                View Plans
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#FF6A00" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M3 8.5l3.2 3.2L13 5" />
                </svg>
                No credit card needed
              </span>
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#FF6A00" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M3 8.5l3.2 3.2L13 5" />
                </svg>
                JazzCash / Easypaisa accepted
              </span>
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#FF6A00" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M3 8.5l3.2 3.2L13 5" />
                </svg>
                WhatsApp support
              </span>
            </div>
          </div>

          {/* Right: live stats glass card */}
          <HeroCard />
        </div>
      </section>

      <CategoryChips />
      <StatsStrip />
      <ToolsPreview />
      <PlansSection />

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            How It <span className="text-gradient-orange">Works</span>
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            From signup to unlocked tools in four simple steps.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="glass card-glow rounded-2xl p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-light text-lg font-extrabold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-sm font-bold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Frequently Asked <span className="text-gradient-orange">Questions</span>
          </h2>
        </div>
        <FaqAccordion />
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="glass card-glow relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-0 hero-grid-bg opacity-60" aria-hidden />
          <div className="relative">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Ready to unlock <span className="text-gradient-orange">100+ AI tools</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
              Create your free account today — pay only when you pick a plan.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Create Free Account
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-slate-100 transition-colors hover:border-brand/60 hover:text-brand-light"
              >
                Compare Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
