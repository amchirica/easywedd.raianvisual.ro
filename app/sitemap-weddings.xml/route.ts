import { createAdminClientAsync } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/url";

export async function GET() {
  const appUrl = getSiteUrl();
  let urls: string[] = [];

  try {
    const supabase = await createAdminClientAsync();
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
  } catch {
    // Service role missing in some environments — empty sitemap is fine
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
