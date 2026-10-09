// Shared API types for the Sigma Pack public frontend.
// Mirrors the API contract implemented by the backend agent.

export interface Tool {
  id: string | number;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon_svg: string;
  url: string;
  has_credentials?: boolean;
}

export interface Plan {
  id: string | number;
  slug: string;
  name: string;
  months: number;
  price_pkr: number;
  features: string[];
  sort: number;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
}

export interface Subscription {
  id: string | number;
  plan_name: string;
  months: number;
  price_pkr: number;
  status: string;
  expires_at: string;
  activated_at: string;
}

export interface Order {
  id: string | number;
  plan_id?: string | number;
  plan_name: string;
  months: number;
  price_pkr: number;
  status: string;
  created_at?: string;
}

export interface PaymentInfo {
  jazzcash_number: string;
  easypaisa_number: string;
  whatsapp_number: string;
  whatsapp_link: string;
}

export interface SiteStats {
  tools_count: number;
  buyers_count: number;
  active_subs: number;
}

export function formatRs(n: number): string {
  return "Rs " + Number(n).toLocaleString("en-PK");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
