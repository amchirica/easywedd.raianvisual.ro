import type { Metadata } from "next";

import { DistributePanel } from "@/components/invitations/distribute-panel";
import { EmptyState } from "@/components/planner/empty-state";
import { appBaseUrl, loadInvitationProject } from "@/lib/invitations/load-project";

export const metadata: Metadata = { title: "Distribuire invitație" };

type PageProps = { params: Promise<{ id: string }> };

export default async function DistributeInvitationPage({ params }: PageProps) {
  const { id } = await params;
  const loaded = await loadInvitationProject(id);
  if (loaded.error || !loaded.data) {
    return <EmptyState title="Proiect indisponibil" description={loaded.error ?? ""} />;
  }

  const { project, content, ctx } = loaded.data;
  const base = appBaseUrl();
  const previewUrl = `${base}/i/p/${project.id}?k=${project.preview_key}`;
  const coupleLabel = [content.coupleName1, content.coupleName2]
    .filter(Boolean)
    .join(" & ");

  const [{ data: guests }, { data: recipients }] = await Promise.all([
    ctx.supabase
      .from("guests")
      .select("id, first_name, last_name, email")
      .eq("wedding_id", ctx.weddingId)
      .order("last_name"),
    ctx.supabase
      .from("invitation_recipients")
      .select("id, guest_id, opened_at, rsvp_completed_at")
      .eq("invitation_project_id", project.id),
  ]);

  const guestMap = new Map((guests ?? []).map((g) => [g.id, g]));
  const mapped = (recipients ?? []).map((r) => ({
    id: r.id,
    guest_id: r.guest_id,
    opened_at: r.opened_at,
    rsvp_completed_at: r.rsvp_completed_at,
    guest: guestMap.get(r.guest_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Distribuire</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Link, QR, email 1:1 și WhatsApp manual
        </p>
      </header>
      <DistributePanel
        projectId={project.id}
        previewUrl={previewUrl}
        coupleLabel={coupleLabel || project.name}
        guests={guests ?? []}
        recipients={mapped}
        baseUrl={base}
      />
    </div>
  );
}
