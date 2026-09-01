// Fork status vocabulary from the design system (§4.1 + §4.1a). Shared by the
// badges and dots rendered in the tables, and by the Manifest data schema.

/** Crate publication status (design system §4.1). */
export type CrateStatus = "published" | "unpublished" | "pending" | "outdated";

export const CRATE_STATUS_META: Record<
    CrateStatus,
    { glyph: string; label: string }
> = {
    published: { glyph: "●", label: "Published" },
    unpublished: { glyph: "○", label: "Unpublished" },
    pending: { glyph: "◐", label: "Pending" },
    outdated: { glyph: "◑", label: "Outdated" },
};

/**
 * Maintenance signal (design system §4.1a) — a separate question from crate
 * publication. Only present where the source content actually states one;
 * absence means "no flagged concern", not a confirmed clean bill of health.
 */
export type MaintenanceState = "needs-maintainer" | "finding-direction";

export const MAINTENANCE_LABELS: Record<MaintenanceState, string> = {
    "needs-maintainer": "needs a maintainer",
    "finding-direction": "governance still forming",
};
