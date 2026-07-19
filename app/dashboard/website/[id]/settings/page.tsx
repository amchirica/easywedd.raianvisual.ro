import type { Metadata } from "next";

import { EmptyState } from "@/components/planner/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWeddingSiteSettingsAction } from "@/lib/actions/website";
import { requireWeddingContext } from "@/lib/planner/context";

export const metadata: Metadata = { title: "Setări website" };

type PageProps = { params: Promise<{ id: string }> };

export default async function WebsiteSettingsPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return <EmptyState title="Workspace incomplet" description={ctx.error ?? ""} />;
  }

  const { data: site } = await ctx.context.supabase
    .from("wedding_sites")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ctx.context.workspaceId)
    .maybeSingle();

  if (!site) return <EmptyState title="Site negăsit" description="" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Setări & SEO</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Custom domain: stare pending/verified/failed (fără DNS live în MVP)
        </p>
      </header>

      <form action={updateWeddingSiteSettingsAction} className="max-w-xl space-y-4">
        <input type="hidden" name="site_id" value={site.id} />
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input name="slug" defaultValue={site.slug} required />
        </div>
        <div className="space-y-1">
          <Label>SEO title</Label>
          <Input name="seo_title" defaultValue={site.seo_title ?? ""} />
        </div>
        <div className="space-y-1">
          <Label>SEO description</Label>
          <Input name="seo_description" defaultValue={site.seo_description ?? ""} />
        </div>
        <div className="space-y-1">
          <Label>Social image URL</Label>
          <Input name="social_image_url" defaultValue={site.social_image_url ?? ""} />
        </div>
        <div className="space-y-1">
          <Label>Custom domain</Label>
          <Input
            name="custom_domain"
            defaultValue={site.custom_domain ?? ""}
            placeholder="nunta-andrei-maria.ro"
          />
          <p className="text-xs text-muted-foreground">
            Status: {site.domain_status}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="password_protected"
            defaultChecked={site.password_protected}
          />
          Protejat cu parolă
        </label>
        <div className="space-y-1">
          <Label>Parolă nouă (opțional)</Label>
          <Input name="password" type="password" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="analytics_enabled"
            defaultChecked={site.analytics_enabled}
          />
          Analytics vizite
        </label>
        <Button type="submit">Salvează</Button>
      </form>
    </div>
  );
}
