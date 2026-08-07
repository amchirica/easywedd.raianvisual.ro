/**
 * Admin prep — aggregate assistant telemetry from product_events.
 * Does not expose private conversation transcripts.
 */

import { createClient } from "@/lib/supabase/server";

export type AssistantAdminStats = {
  topCategories: { category: string; count: number }[];
  unansweredCount: number;
  topPages: { page: string; count: number }[];
  negativeFeedbackCount: number;
};

type EventRow = {
  event_name: string;
  properties: Record<string, unknown> | null;
};

export async function getAssistantAdminStats(): Promise<AssistantAdminStats> {
  const empty: AssistantAdminStats = {
    topCategories: [],
    unansweredCount: 0,
    topPages: [],
    negativeFeedbackCount: 0,
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_events")
      .select("event_name, properties")
      .in("event_name", ["assistant_ask", "assistant_feedback"])
      .order("occurred_at", { ascending: false })
      .limit(500);

    if (error || !data) return empty;

    const rows = data as EventRow[];
    const categoryCount = new Map<string, number>();
    const pageCount = new Map<string, number>();
    let unansweredCount = 0;
    let negativeFeedbackCount = 0;

    for (const row of rows) {
      const props = row.properties ?? {};
      if (row.event_name === "assistant_ask") {
        const category = String(props.category ?? "unknown");
        categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
        const page = String(props.page ?? "/dashboard");
        pageCount.set(page, (pageCount.get(page) ?? 0) + 1);
        if (props.answered === false) unansweredCount += 1;
      }
      if (row.event_name === "assistant_feedback" && props.helpful === false) {
        negativeFeedbackCount += 1;
      }
    }

    const sortMap = (map: Map<string, number>) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => ({ category: key, count }));

    return {
      topCategories: sortMap(categoryCount).map(({ category, count }) => ({
        category,
        count,
      })),
      unansweredCount,
      topPages: [...pageCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page, count]) => ({ page, count })),
      negativeFeedbackCount,
    };
  } catch {
    return empty;
  }
}
