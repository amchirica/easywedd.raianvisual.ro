import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  let urls: string[] = [];

  if (url && serviceKey) {
    const supabase = createClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await supabase
      .from("wedding_sites")
      .select("slug, updated_at")
      .eq("status", "published")
      .eq("password_protected", false);

    urls = (data ?? []).map(
      (site) => `
  <url>
    <loc>${appUrl}/w/${site.slug}</loc>
    <lastmod>${new Date(site.updated_at).toISOString()}</lastmod>
  </url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
