// Buyer dashboard: subscription card, order history, My Tools with credential reveal,
// change-password form, WhatsApp support button.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import type { Order, Subscription, Tool, User } from "@/components/types";
import { copyText, formatRs } from "@/components/types";

interface Credentials {
  tool_name: string;
  label: string;
  username: string;
  password: string;
  notes?: string;
}

function daysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function fmtDate(s: string): string {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "approved" || s === "verified") return "bg-green-500/15 text-green-300 border-green-500/30";
  if (s === "pending") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Order[]>([]);
  const [myTools, setMyTools] = useState<Tool[] | null>(null);
  const [toolsForbidden, setToolsForbidden] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Reveal modal state
  const [revealFor, setRevealFor] = useState<Tool | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");
  const [copied, setCopied] = useState("");

  // Change password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // Auth
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        if (!me.ok) {
          router.push("/login");
          return;
        }
        const meData = await me.json();
        if (alive) setUser(meData.user);
      } catch {
        router.push("/login");
        return;
      }
      if (alive) setAuthChecked(true);

      // Subscription + history
      try {
        const res = await fetch("/api/subscription", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (alive) {
            setSubscription(data.subscription ?? null);
            setHistory(data.history ?? []);
          }
        }
      } catch {
        /* subscription api not ready yet */
      }

      // My tools
      try {
        const res = await fetch("/api/my-tools", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (alive) setMyTools(data.tools ?? []);
        } else if (res.status === 403) {
          if (alive) setToolsForbidden(true);
        }
      } catch {
        /* my-tools api not ready yet */
      }

      // WhatsApp support
      try {
        const res = await fetch("/api/settings/public", { cache: "no-store" });
        if (res.ok && alive) {
          const data = await res.json();
          setWhatsapp(data.whatsapp_number ?? "");
        }
      } catch {
        /* settings api not ready yet */
      }

      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const reveal = async (tool: Tool) => {
    setRevealFor(tool);
    setCreds(null);
    setRevealError("");
    setRevealLoading(true);
    setCopied("");
    try {
      const res = await fetch("/api/credentials/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_id: tool.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRevealError(data.error ?? "Could not reveal credentials. Please try again.");
        return;
      }
      setCreds(data);
    } catch {
      setRevealError("Something went wrong. Please try again.");
    } finally {
      setRevealLoading(false);
    }
  };

  const copyField = async (label: string, value: string) => {
    const ok = await copyText(value);
    setCopied(ok ? label : "Copy failed — select the text manually.");
    if (ok) setTimeout(() => setCopied(""), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwErr(data.error ?? "Could not change your password. Please try again.");
        return;
      }
      setPwMsg("Password changed successfully.");
      setCurrentPw("");
      setNewPw("");
    } catch {
      setPwErr("Something went wrong. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <p className="text-sm text-slate-400">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-white">
          Welcome{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-400">Your Sigma Pack dashboard.</p>

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="glass h-56 animate-pulse rounded-3xl" />
            <div className="glass h-56 animate-pulse rounded-3xl" />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Subscription card */}
              <div className="glass card-glow rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white">My Subscription</h2>
                {subscription ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xl font-extrabold text-white">{subscription.plan_name}</p>
                        <p className="mt-0.5 text-sm text-slate-400">
                          {formatRs(subscription.price_pkr)} ·{" "}
                          {subscription.months === 1 ? "1 month" : `${subscription.months} months`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-slate-500">Expires on</p>
                        <p className="mt-0.5 text-sm font-bold text-white">{fmtDate(subscription.expires_at)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-slate-500">Days left</p>
                        <p className="mt-0.5 text-sm font-bold text-brand-light">
                          {daysLeft(subscription.expires_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm text-slate-400">
                      No active subscription yet. Pick a plan to unlock all 100+ tools.
                    </p>
                    <Link href="/plans" className="btn-primary mt-4 inline-flex">
                      Browse Plans
                    </Link>
                  </div>
                )}
              </div>

              {/* Support / account card */}
              <div className="glass card-glow rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white">Support</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Need help with a tool, your plan or payment? Message us on WhatsApp — we reply fast.
                </p>
                {whatsapp ? (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      "Assalam o Alaikum, mujhe Sigma Pack ke baare mein help chahiye."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/20"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.2.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.3 1.4z" />
                    </svg>
                    WhatsApp Support
                  </a>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Support number loading…</p>
                )}
              </div>
            </div>

            {/* My Tools */}
            <section className="mt-10">
              <h2 className="text-xl font-extrabold text-white">
                My <span className="text-gradient-orange">Tools</span>
              </h2>
              {toolsForbidden ? (
                <div className="glass mt-4 rounded-2xl p-8 text-center">
                  <p className="text-sm font-bold text-slate-200">Your tools are locked.</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                    An active subscription unlocks every tool and its login details.
                  </p>
                  <Link href="/plans" className="btn-primary mt-4 inline-flex">
                    Get a Plan
                  </Link>
                </div>
              ) : myTools && myTools.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {myTools.map((t, i) => (
                    <div key={t.id} className="relative">
                      <ToolCard tool={t} index={i} />
                      {t.has_credentials && (
                        <button
                          onClick={() => reveal(t)}
                          className="btn-primary mt-2 w-full !py-2 text-sm"
                        >
                          Reveal login
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : myTools ? (
                <p className="glass mt-4 rounded-2xl p-6 text-center text-sm text-slate-400">
                  No tools assigned yet. If you just subscribed, give our team a moment to activate you.
                </p>
              ) : null}
            </section>

            {/* Order history */}
            <section className="mt-10">
              <h2 className="text-xl font-extrabold text-white">
                Order <span className="text-gradient-orange">History</span>
              </h2>
              {history.length > 0 ? (
                <div className="glass mt-4 overflow-x-auto rounded-2xl">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((o) => (
                        <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 font-mono text-xs text-slate-300">#{String(o.id).slice(0, 8)}</td>
                          <td className="px-4 py-3 font-semibold text-white">{o.plan_name}</td>
                          <td className="px-4 py-3 text-slate-300">{formatRs(o.price_pkr)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusColor(o.status)}`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{o.created_at ? fmtDate(o.created_at) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="glass mt-4 rounded-2xl p-6 text-center text-sm text-slate-400">
                  No orders yet.
                </p>
              )}
            </section>

            {/* Change password */}
            <section className="mt-10">
              <div className="glass max-w-xl rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white">Change Password</h2>
                {pwMsg && (
                  <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    {pwMsg}
                  </div>
                )}
                {pwErr && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {pwErr}
                  </div>
                )}
                <form onSubmit={changePassword} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="currentPw" className="mb-1.5 block text-sm font-semibold text-slate-300">
                      Current password
                    </label>
                    <input
                      id="currentPw"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPw" className="mb-1.5 block text-sm font-semibold text-slate-300">
                      New password
                    </label>
                    <input
                      id="newPw"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="input-dark"
                    />
                  </div>
                  <button type="submit" disabled={pwLoading} className="btn-primary !px-5 !py-2.5 text-sm disabled:opacity-60">
                    {pwLoading ? "Updating…" : "Update Password"}
                  </button>
                </form>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Reveal credentials modal */}
      {revealFor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setRevealFor(null);
            setCreds(null);
          }}
        >
          <div
            className="glass card-glow w-full max-w-md rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Login details for ${revealFor.name}`}
          >
            <h3 className="text-lg font-bold text-white">{revealFor.name} — login details</h3>

            {revealLoading && <p className="mt-4 text-sm text-slate-400">Revealing credentials…</p>}

            {revealError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {revealError}
              </div>
            )}

            {creds && (
              <div className="mt-4 space-y-3">
                {creds.label && <p className="text-sm text-slate-400">{creds.label}</p>}
                <CredField
                  label="Username"
                  value={creds.username}
                  copied={copied === "Username"}
                  onCopy={() => copyField("Username", creds.username)}
                />
                <CredField
                  label="Password"
                  value={creds.password}
                  copied={copied === "Password"}
                  onCopy={() => copyField("Password", creds.password)}
                  masked
                />
                {creds.notes && <p className="text-xs text-slate-500">{creds.notes}</p>}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
                  ⚠️ Keep these logins private. Do not share them with anyone — accounts get locked if
                  too many people log in at once.
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setRevealFor(null);
                setCreds(null);
              }}
              className="mt-5 w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-brand/60"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function CredField({
  label,
  value,
  copied,
  onCopy,
  masked = false,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  masked?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-white">
          {masked && !show ? "••••••••••" : value}
        </code>
        {masked && (
          <button
            onClick={() => setShow((v) => !v)}
            className="shrink-0 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-brand/60"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
        <button
          onClick={onCopy}
          className="shrink-0 rounded-xl bg-brand px-3 py-2.5 text-xs font-bold text-white hover:bg-brand-dark"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}
