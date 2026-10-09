// /api/orders — buyer: create order (POST) and list own orders (GET).
import { db } from '@/lib/db';
import { jsonError, bad, reqString } from '@/lib/validation';
import { getSettings, parseBody, requireBuyer, reqUuid } from '@/lib/guard';
import { logAudit } from '@/lib/audit';

function paymentBlock(s: {
  jazzcash_number: string;
  easypaisa_number: string;
  whatsapp_number: string;
}) {
  return {
    jazzcash_number: s.jazzcash_number,
    easypaisa_number: s.easypaisa_number,
    whatsapp_number: s.whatsapp_number,
  };
}

function whatsappLink(whatsapp_number: string, plan_name: string, price_pkr: number, orderId: string): string {
  const digits = whatsapp_number.replace(/\D/g, '');
  const text = `Assalam-o-Alaikum! I chose the ${plan_name} plan (Rs ${price_pkr}). Order ID: ${orderId}. I am sending my payment screenshot.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export async function POST(req: Request) {
  try {
    const session = await requireBuyer();
    const body = await parseBody(req);
    const planId = reqUuid(reqString(body.plan_id, 'plan_id'), 'plan_id');

    const sql = db();
    const planRows = await sql`SELECT id, name, months, price_pkr FROM plans WHERE id = ${planId} AND active = true`;
    const plan = planRows[0] as { id: string; name: string; months: number; price_pkr: number } | undefined;
    if (!plan) throw bad('Selected plan is not available.');

    const orderRows = await sql`
      INSERT INTO orders (buyer_id, plan_id, months, price_pkr, status)
      VALUES (${session.sub}, ${plan.id}, ${plan.months}, ${plan.price_pkr}, 'pending')
      RETURNING id`;
    const orderId = (orderRows[0] as { id: string }).id;

    const s = await getSettings(sql);
    await logAudit('buyer', session.sub, 'order_created', `order ${orderId} plan ${plan.name}`);

    return Response.json(
      {
        order: {
          id: orderId,
          plan_name: plan.name,
          months: plan.months,
          price_pkr: plan.price_pkr,
          status: 'pending',
        },
        payment: {
          ...paymentBlock(s),
          whatsapp_link: whatsappLink(s.whatsapp_number, plan.name, plan.price_pkr, orderId),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return jsonError(err);
  }
}

export async function GET() {
  try {
    const session = await requireBuyer();
    const sql = db();
    const rows = await sql`
      SELECT o.id, p.name AS plan_name, o.months, o.price_pkr, o.status, o.created_at, o.expires_at
      FROM orders o JOIN plans p ON p.id = o.plan_id
      WHERE o.buyer_id = ${session.sub}
      ORDER BY o.created_at DESC`;
    return Response.json({ orders: rows });
  } catch (err) {
    return jsonError(err);
  }
}
