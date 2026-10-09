// GET /api/settings/public — never exposes payment numbers.
import { db } from '@/lib/db';
import { jsonError } from '@/lib/validation';
import { getSettings } from '@/lib/guard';

export async function GET() {
  try {
    const s = await getSettings(db());
    return Response.json({
      site_name: s.site_name,
      whatsapp_number: s.whatsapp_number,
      support_text: s.support_text,
    });
  } catch (err) {
    return jsonError(err);
  }
}
