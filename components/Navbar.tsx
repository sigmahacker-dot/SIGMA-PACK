// Site navbar: logo left, nav links, auth-aware buttons, mobile hamburger.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import type { User } from "./types";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
  { href: "/plans", label: "Plans" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (alive && res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        }
      } catch {
        /* not logged in / api not ready yet */
      } finally {
        if (alive) setChecked(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const linkCls = (href: string) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      pathname === href ? "text-brand bg-brand/10" : "text-slate-300 hover:text-white hover:bg-white/5"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="Sigma Pack home">
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {checked && user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-brand/60 hover:text-brand"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="btn-primary !px-5 !py-2 text-sm">
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-navy-950 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls(l.href)} onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              {checked && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-slate-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-slate-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-slate-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link href="/signup" className="btn-primary text-sm" onClick={() => setMenuOpen(false)}>
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
