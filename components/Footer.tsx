// Site footer: brand, quick links, WhatsApp support, credits note.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function Footer() {
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/settings/public", { cache: "no-store" });
        if (alive && res.ok) {
          const data = await res.json();
          setWhatsapp(data.whatsapp_number ?? "");
        }
      } catch {
        /* settings api not ready yet */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-navy-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Sigma Pack bundles 100+ premium AI tools — video, design, writing, audio, marketing and
            more — into one simple subscription. Create anything, faster and cheaper.
          </p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.2.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.3 1.4z" />
              </svg>
              Chat with us on WhatsApp
            </a>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="text-slate-400 hover:text-brand">
                Home
              </Link>
            </li>
            <li>
              <Link href="/tools" className="text-slate-400 hover:text-brand">
                All Tools
              </Link>
            </li>
            <li>
              <Link href="/plans" className="text-slate-400 hover:text-brand">
                Pricing Plans
              </Link>
            </li>
            <li>
              <Link href="/signup" className="text-slate-400 hover:text-brand">
                Create Account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Account</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/login" className="text-slate-400 hover:text-brand">
                Login
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-slate-400 hover:text-brand">
                My Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {year} Sigma Pack. All rights reserved.</p>
          <p>Photo Credits: all tool icons are original letter-marks generated for Sigma Pack.</p>
        </div>
      </div>
    </footer>
  );
}
