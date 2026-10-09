// Order page: summary + payment instructions (JazzCash / Easypaisa) + WhatsApp button.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Order, PaymentInfo } from "@/components/types";
import { copyText, formatRs } from "@/components/types";

function PayNumber({ label, number, copied, onCopy }: { label: string; number: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-lg font-bold text-white">{number}</p>
        <button
          onClick={onCopy}
          className="shrink-0 rounded-xl border border-brand/50 px-3 py-1.5 text-xs font-bold text-brand-light hover:bg-brand/10"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [planName, setPlanName] = useState("");
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        if (!me.ok) {
          router.push("/login");
          return;
        }
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) {
          if (alive) setError("Order not found. It may belong to a different account.");
          return;
        }
        const data = await res.json();
        if (alive) {
          setOrder(data.order ?? null);
          setPlanName(data.plan_name ?? data.order?.plan_name ?? "");
          setPayment(data.payment ?? null);
        }
      } catch {
        if (alive) setError("Something went wrong while loading your order.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId, router]);

  const copyNumber = async (label: string, value: string) => {
    const ok = await copyText(value);
    setCopied(ok ? label : "");
    if (ok) setTimeout(() => setCopied(""), 2000);
  };

  const waText = order
    ? `Assalam o Alaikum! Maine Sigma Pack ka plan buy kiya hai.\nPlan: ${planName}\nAmount: ${formatRs(order.price_pkr)}\nOrder: ${orderId}\nPayment screenshot attach kar raha hoon. Please activate kar dein.`
    : "";

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-white">
          Complete Your <span className="text-gradient-orange">Payment</span>
        </h1>

        {loading ? (
          <div className="glass mt-6 h-64 animate-pulse rounded-3xl" />
        ) : error ? (
          <div className="glass mt-6 rounded-3xl p-8 text-center">
            <p className="text-sm font-semibold text-red-300">{error}</p>
            <Link href="/plans" className="btn-primary mt-4 inline-flex">
              Back to Plans
            </Link>
          </div>
        ) : (
          order && (
            <div className="mt-6 space-y-5">
              {/* Order summary */}
              <div className="glass card-glow rounded-3xl p-6">
                <h2 className="text-lg font-bold text-white">Order Summary</h2>
                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID</span>
                    <span className="font-mono text-xs text-slate-200">{String(order.id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plan</span>
                    <span className="font-semibold text-white">{planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration</span>
                    <span className="text-white">{order.months === 1 ? "1 month" : `${order.months} months`}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2.5">
                    <span className="text-slate-400">Amount to pay</span>
                    <span className="text-lg font-extrabold text-gradient-orange">{formatRs(order.price_pkr)}</span>
                  </div>
                </div>
              </div>

              {/* Payment box */}
              {payment && (
                <div className="glass card-glow rounded-3xl p-6">
                  <h2 className="text-lg font-bold text-white">Pay to any of these numbers</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Send exactly <span className="font-bold text-white">{formatRs(order.price_pkr)}</span> via
                    JazzCash or Easypaisa.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <PayNumber
                      label="JazzCash"
                      number={payment.jazzcash_number}
                      copied={copied === "JazzCash"}
                      onCopy={() => copyNumber("JazzCash", payment.jazzcash_number)}
                    />
                    <PayNumber
                      label="Easypaisa"
                      number={payment.easypaisa_number}
                      copied={copied === "Easypaisa"}
                      onCopy={() => copyNumber("Easypaisa", payment.easypaisa_number)}
                    />
                  </div>

                  <a
                    href={payment.whatsapp_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-5 w-full !bg-none !bg-green-600 hover:!bg-green-700 !shadow-[0_8px_24px_rgba(34,197,94,0.35)]"
                    onClick={(e) => {
                      // Prefer our own prefilled message when the API link lacks one
                      if (payment.whatsapp_link && !payment.whatsapp_link.includes("text=") && waText) {
                        e.preventDefault();
                        const num = payment.whatsapp_number.replace(/\D/g, "");
                        window.open(`https://wa.me/${num}?text=${encodeURIComponent(waText)}`, "_blank");
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.2.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.3 1.4z" />
                    </svg>
                    Send Screenshot on WhatsApp
                  </a>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Apni payment ka screenshot WhatsApp par bhejein — team verify karke aapka subscription
                    activate kar degi.
                  </p>
                </div>
              )}

              {/* Status note */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                ⏳ Your subscription activates after our team verifies your payment. This usually takes
                a few hours — check your dashboard later for updates.
              </div>

              <div className="text-center">
                <Link href="/dashboard" className="text-sm font-semibold text-brand-light hover:underline">
                  Go to Dashboard →
                </Link>
              </div>
            </div>
          )
        )}
      </main>
      <Footer />
    </div>
  );
}
