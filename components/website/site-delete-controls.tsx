"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import {
  getWeddingSiteDeleteImpact,
  hardDeleteWeddingSiteAction,
  restoreWeddingSiteAction,
  softDeleteWeddingSiteAction,
} from "@/lib/actions/deletion";
import type { DeleteImpact } from "@/lib/deletion/types";
import { emptyImpact } from "@/lib/deletion/types";

type Props = {
  siteId: string;
  siteSlug: string;
  isArchived?: boolean;
};

export function SiteDeleteControls({ siteId, siteSlug, isArchived }: Props) {
  const router = useRouter();
  const [impact, setImpact] = useState<DeleteImpact>(
    emptyImpact({
      resourceLabel: "website",
      resourceName: `/w/${siteSlug}`,
      canRestore: Boolean(isArchived),
      canSoftDelete: !isArchived,
    }),
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      void getWeddingSiteDeleteImpact(siteId).then((data) => {
        if (data) setImpact(data);
      });
    });
  }, [siteId]);

  return (
    <DeleteConfirmDialog
      triggerLabel={isArchived ? "Gestionează ștergerea" : "Șterge site"}
      impact={impact}
      onSoftDelete={async () => softDeleteWeddingSiteAction(siteId)}
      onHardDelete={async () => {
        const result = await hardDeleteWeddingSiteAction(siteId);
        if (result.ok) router.push("/dashboard/website");
        return result;
      }}
      onRestore={
        isArchived
          ? async () => restoreWeddingSiteAction(siteId)
          : undefined
      }
    />
  );
}
