// GET /api/orders/[id] — buyer: one own order + payment details.
import { db } from '@/lib/db';
import { jsonError, ApiError } from '@/lib/validation';
import { getSettings, requireBuyer, reqUuid } from '@/lib/guard';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireBuyer();
    const orderId = reqUuid(params.id);
    const sql = db();
    const rows = await sql`
      SELECT o.id, o.months, o.price_pkr, o.status, o.created_at, o.expires_at,
             p.name AS plan_name
      FROM orders o JOIN plans p ON p.id = o.plan_id
      WHERE o.id = ${orderId} AND o.buyer_id = ${session.sub}`;
    const order = rows[0] as {
      id: string; months: number; price_pkr: number; status: string;
      created_at: string; expires_at: string | null; plan_name: string;
    } | undefined;
    if (!order) throw new ApiError(404, 'Not found.');

    const s = await getSettings(sql);
    const digits = s.whatsapp_number.replace(/\D/g, '');
    const text = `Assalam-o-Alaikum! I chose the ${order.plan_name} plan (Rs ${order.price_pkr}). Order ID: ${order.id}. I am sending my payment screenshot.`;
    return Response.json({
      order,
      plan_name: order.plan_name,
      payment: {
        jazzcash_number: s.jazzcash_number,
        easypaisa_number: s.easypaisa_number,
        whatsapp_number: s.whatsapp_number,
        whatsapp_link: `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
