"use server";

import type { ErrorCode } from "@/lib/i18n/errors";
import { canAccessFeature } from "@/lib/planner/access";
import { requireWeddingContext } from "@/lib/planner/context";
import {
  escapeIlike,
  guestDisplayName,
  groupSearchHits,
  isSearchQueryReady,
  normalizeSearchQuery,
  SEARCH_LIMIT_PER_CATEGORY,
  type SearchHit,
  type SearchResult,
} from "@/lib/search/types";

function pattern(query: string) {
  const safe = escapeIlike(query);
  if (!safe) return null;
  return `%${safe}%`;
}

function orIlike(columns: string[], like: string) {
  return columns.map((col) => `${col}.ilike.${like}`).join(",");
}

export async function searchWorkspaceAction(
  rawQuery: string,
): Promise<SearchResult> {
  const query = normalizeSearchQuery(rawQuery);
  if (!isSearchQueryReady(query)) {
    return { groups: [] };
  }

  const ctx = await requireWeddingContext();
  if (ctx.error || !ctx.context) {
    return {
      groups: [],
      error: ctx.error ?? "unauthenticated",
      errorCode: "unauthenticated" satisfies ErrorCode,
    };
  }

  const { supabase, weddingId, workspaceId, entitlements } = ctx.context;
  const like = pattern(query);
  if (!like) {
    return { groups: [] };
  }
  const limit = SEARCH_LIMIT_PER_CATEGORY;
  const hits: SearchHit[] = [];

  const canGuests = canAccessFeature(entitlements, "guests");
  const canVendors = canAccessFeature(entitlements, "vendors");
  const canPlanner = canAccessFeature(entitlements, "planner");
  const canBudget = canAccessFeature(entitlements, "budget");
  const canSeating = canAccessFeature(entitlements, "seating");
  const canInvitations = canAccessFeature(entitlements, "invitations");
  const canWebsite = canAccessFeature(entitlements, "website");

  const jobs: Promise<void>[] = [];

  if (canGuests) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("guests")
          .select("id, first_name, last_name, email, phone")
          .eq("wedding_id", weddingId)
          .eq("is_anonymized", false)
          .or(orIlike(["first_name", "last_name", "email", "phone"], like))
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "guests",
            title: guestDisplayName(row.first_name, row.last_name),
            subtitle: row.email || row.phone || undefined,
            href: `/dashboard/guests?q=${encodeURIComponent(query)}`,
          });
        }
      })(),
    );
  }

  if (canVendors) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("vendors")
          .select("id, company_name, contact_name, email, category")
          .eq("wedding_id", weddingId)
          .or(
            orIlike(
              ["company_name", "contact_name", "email", "notes"],
              like,
            ),
          )
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "vendors",
            title: row.company_name,
            subtitle: row.contact_name || row.email || row.category || undefined,
            href: "/dashboard/vendors",
          });
        }
      })(),
      (async () => {
        const { data } = await supabase
          .from("vendor_documents")
          .select("id, title, document_type, vendor_id")
          .eq("workspace_id", workspaceId)
          .or(orIlike(["title", "document_type"], like))
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "documents",
            title: row.title,
            subtitle: row.document_type || undefined,
            href: "/dashboard/vendors",
          });
        }
      })(),
    );
  }

  if (canPlanner) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("wedding_tasks")
          .select("id, title, status, due_date, description")
          .eq("wedding_id", weddingId)
          .or(orIlike(["title", "description"], like))
          .limit(limit * 2);
        for (const row of data ?? []) {
          hits.push({
            id: `task-${row.id}`,
            category: "tasks",
            title: row.title,
            subtitle: row.status || undefined,
            href: "/dashboard/planner",
          });
          if (row.due_date) {
            hits.push({
              id: `cal-${row.id}`,
              category: "calendar",
              title: row.title,
              subtitle: row.due_date,
              href: "/dashboard/planner?view=calendar",
            });
          }
        }
      })(),
      (async () => {
        const { data } = await supabase
          .from("wedding_timeline_items")
          .select("id, title, location, start_time")
          .eq("wedding_id", weddingId)
          .or(
            orIlike(
              ["title", "location", "notes", "responsible_person"],
              like,
            ),
          )
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "timeline",
            title: row.title,
            subtitle: row.location || row.start_time || undefined,
            href: "/dashboard/timeline",
          });
        }
      })(),
    );
  }

  if (canBudget) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("budget_items")
          .select("id, name, notes, payment_status, currency")
          .eq("wedding_id", weddingId)
          .or(orIlike(["name", "notes"], like))
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "budget",
            title: row.name,
            subtitle: row.payment_status || undefined,
            href: "/dashboard/budget",
          });
        }
      })(),
      (async () => {
        const { data } = await supabase
          .from("payments")
          .select("id, reference, amount, budget_item_id, payment_date")
          .eq("workspace_id", workspaceId)
          .ilike("reference", like)
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: `pay-${row.id}`,
            category: "budget",
            title: row.reference || String(row.amount),
            subtitle: row.payment_date || undefined,
            href: "/dashboard/budget",
          });
        }
      })(),
    );
  }

  if (canSeating) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("tables")
          .select("id, label, capacity, shape")
          .eq("wedding_id", weddingId)
          .ilike("label", like)
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "seating",
            title: row.label,
            subtitle: `${row.capacity}`,
            href: "/dashboard/seating",
          });
        }
      })(),
    );
  }

  if (canInvitations) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("invitation_projects")
          .select("id, name, status")
          .eq("wedding_id", weddingId)
          .is("soft_deleted_at", null)
          .ilike("name", like)
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "invitations",
            title: row.name,
            subtitle: row.status || undefined,
            href: `/dashboard/invitations/${row.id}`,
          });
        }
      })(),
    );
  }

  if (canWebsite) {
    jobs.push(
      (async () => {
        const { data } = await supabase
          .from("wedding_sites")
          .select("id, slug, status")
          .eq("workspace_id", workspaceId)
          .is("soft_deleted_at", null)
          .ilike("slug", like)
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({
            id: row.id,
            category: "website",
            title: row.slug,
            subtitle: row.status || undefined,
            href: `/dashboard/website/${row.id}`,
          });
        }
      })(),
    );
  }

  try {
    await Promise.all(jobs);
  } catch {
    return {
      groups: [],
      errorCode: "generic" satisfies ErrorCode,
    };
  }

  const capped = groupSearchHits(hits).map((group) => ({
    ...group,
    items: group.items.slice(0, limit),
  }));

  return { groups: capped };
}
