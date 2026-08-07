import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/locale";
import { notFound } from "next/navigation";

import { AdminConfirmDelete } from "@/components/admin/admin-confirm-delete";
import { AdminWeddingForm } from "@/components/admin/admin-wedding-form";
import { AdminWorkspaceSettingsForms } from "@/components/admin/admin-settings-forms";
import {
  adminDeleteContactAction,
  adminDeleteGuestAction,
  adminDeleteTableAction,
  adminDeleteVendorAction,
} from "@/lib/actions/admin-manage";
import {
  ADMIN_WORKSPACE_SECTIONS,
  requireAdminWorkspace,
  type AdminWorkspaceSection,
} from "@/lib/admin/workspace-context";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  return { title: dict.admin.workspaceManageMetaTitle };
}

type PageProps = {
  params: Promise<{ id: string; section: string }>;
};

function isSection(value: string): value is AdminWorkspaceSection {
  return ADMIN_WORKSPACE_SECTIONS.some((s) => s.key === value);
}

export default async function AdminWorkspaceSectionPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const { id, section } = await params;
  if (!isSection(section)) notFound();

  const ctx = await requireAdminWorkspace(id);
  if (!ctx.ok || !ctx.context) {
    return <p className="text-sm text-destructive">{ctx.error}</p>;
  }

  const { workspace, wedding, supabase } = ctx.context;
  const title =
    ADMIN_WORKSPACE_SECTIONS.find((s) => s.key === section)?.label ?? section;

  if (section === "settings") {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-2xl">{title}</h2>
        <AdminWorkspaceSettingsForms workspaceId={id} name={workspace.name} />
      </div>
    );
  }

  if (section === "wedding") {
    if (!wedding) {
      return <p className="text-sm text-muted-foreground">{dict.admin.noWedding}</p>;
    }
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-2xl">{title}</h2>
        <AdminWeddingForm workspaceId={id} wedding={wedding} />
      </div>
    );
  }

  if (!wedding) {
    return (
      <p className="text-sm text-muted-foreground">
        Secțiunea necesită o nuntă asociată workspace-ului.
      </p>
    );
  }

  if (section === "guests") {
    const { data: guests } = await supabase
      .from("guests")
      .select("id, first_name, last_name, email, rsvp_status")
      .eq("workspace_id", id)
      .order("last_name")
      .limit(200);

    return (
      <SectionTable title={title} empty="Niciun invitat.">
        {(guests ?? []).map((g) => (
          <tr key={g.id} className="border-b border-border">
            <td className="px-3 py-2">
              {g.first_name} {g.last_name}
            </td>
            <td className="px-3 py-2">{g.email ?? "—"}</td>
            <td className="px-3 py-2">{g.rsvp_status}</td>
            <td className="px-3 py-2 text-right">
              <AdminConfirmDelete
                workspaceId={id}
                id={g.id}
                action={adminDeleteGuestAction}
              />
            </td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  if (section === "seating") {
    const { data: tables } = await supabase
      .from("tables")
      .select("id, label, shape, capacity, pos_x, pos_y")
      .eq("workspace_id", id)
      .order("sort_order");

    return (
      <SectionTable title={title} empty="Nicio masă.">
        {(tables ?? []).map((t) => (
          <tr key={t.id} className="border-b border-border">
            <td className="px-3 py-2">{t.label}</td>
            <td className="px-3 py-2">{t.shape}</td>
            <td className="px-3 py-2">{t.capacity}</td>
            <td className="px-3 py-2">
              {Math.round(t.pos_x ?? 0)}, {Math.round(t.pos_y ?? 0)}
            </td>
            <td className="px-3 py-2 text-right">
              <AdminConfirmDelete
                workspaceId={id}
                id={t.id}
                action={adminDeleteTableAction}
              />
            </td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  if (section === "budget") {
    const { data: items } = await supabase
      .from("budget_items")
      .select("id, name, estimated_amount, paid_amount, payment_status")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false })
      .limit(200);

    return (
      <SectionTable title={title} empty="Nicio linie de buget.">
        {(items ?? []).map((item) => (
          <tr key={item.id} className="border-b border-border">
            <td className="px-3 py-2">{item.name}</td>
            <td className="px-3 py-2">{item.estimated_amount}</td>
            <td className="px-3 py-2">{item.paid_amount}</td>
            <td className="px-3 py-2">{item.payment_status}</td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  if (section === "vendors") {
    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, company_name, category, status")
      .eq("workspace_id", id)
      .order("company_name");

    return (
      <SectionTable title={title} empty="Niciun vendor.">
        {(vendors ?? []).map((v) => (
          <tr key={v.id} className="border-b border-border">
            <td className="px-3 py-2">{v.company_name}</td>
            <td className="px-3 py-2">{v.category}</td>
            <td className="px-3 py-2">{v.status}</td>
            <td className="px-3 py-2 text-right">
              <AdminConfirmDelete
                workspaceId={id}
                id={v.id}
                action={adminDeleteVendorAction}
              />
            </td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  if (section === "timeline") {
    const { data: items } = await supabase
      .from("wedding_timeline_items")
      .select("id, title, start_time, end_time")
      .eq("workspace_id", id)
      .order("sort_order")
      .limit(200);

    return (
      <SectionTable title={title} empty="Niciun eveniment în timeline.">
        {(items ?? []).map((item) => (
          <tr key={item.id} className="border-b border-border">
            <td className="px-3 py-2">{item.title}</td>
            <td className="px-3 py-2">
              {item.start_time
                ? new Date(item.start_time).toLocaleString("ro-RO")
                : "—"}
            </td>
            <td className="px-3 py-2">
              {item.end_time
                ? new Date(item.end_time).toLocaleString("ro-RO")
                : "—"}
            </td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  if (section === "contacts") {
    const { data: contacts } = await supabase
      .from("wedding_contacts")
      .select("id, name, contact_type, email, phone")
      .eq("workspace_id", id)
      .order("name");

    return (
      <SectionTable title={title} empty="Niciun contact.">
        {(contacts ?? []).map((c) => (
          <tr key={c.id} className="border-b border-border">
            <td className="px-3 py-2">{c.name}</td>
            <td className="px-3 py-2">{c.contact_type}</td>
            <td className="px-3 py-2">{c.email ?? "—"}</td>
            <td className="px-3 py-2">{c.phone ?? "—"}</td>
            <td className="px-3 py-2 text-right">
              <AdminConfirmDelete
                workspaceId={id}
                id={c.id}
                action={adminDeleteContactAction}
              />
            </td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  if (section === "invitations") {
    const { data: projects } = await supabase
      .from("invitation_projects")
      .select("id, name, status, updated_at")
      .eq("workspace_id", id)
      .order("updated_at", { ascending: false });

    return (
      <SectionTable title={title} empty="Niciun proiect de invitație.">
        {(projects ?? []).map((p) => (
          <tr key={p.id} className="border-b border-border">
            <td className="px-3 py-2">{p.name}</td>
            <td className="px-3 py-2">{p.status}</td>
            <td className="px-3 py-2">
              {p.updated_at
                ? new Date(p.updated_at).toLocaleString("ro-RO")
                : "—"}
            </td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  if (section === "website") {
    const { data: sites } = await supabase
      .from("wedding_sites")
      .select("id, slug, status, seo_title, updated_at")
      .eq("workspace_id", id);

    return (
      <SectionTable title={title} empty="Niciun website.">
        {(sites ?? []).map((site) => (
          <tr key={site.id} className="border-b border-border">
            <td className="px-3 py-2">{site.seo_title ?? site.slug}</td>
            <td className="px-3 py-2">{site.slug}</td>
            <td className="px-3 py-2">{site.status}</td>
            <td className="px-3 py-2">
              {site.updated_at
                ? new Date(site.updated_at).toLocaleString("ro-RO")
                : "—"}
            </td>
          </tr>
        ))}
      </SectionTable>
    );
  }

  notFound();
}

function SectionTable({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const rows = Array.isArray(children) ? children : [children];
  const hasRows = rows.filter(Boolean).length > 0;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl">{title}</h2>
      {!hasRows ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-sm">
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
