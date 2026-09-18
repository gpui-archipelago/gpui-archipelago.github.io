// The Gocar section's facts, kept next to the markup that renders them (the
// same pattern as fork-status.ts).
//
// Everything here is sourced rather than invented: the crate facts come from
// the crates.io API for `cargo-gocar`, the command surface and its flags come
// from the tool's own CLI reference, and the descriptions are the studies' own
// wording (docs 07-12), which is where the behaviour was measured against real
// crates.io artifacts. Where the tool has a command no study measured, it is
// listed without an evidence link rather than given a borrowed one.

export interface GocarTab {
    label: string;
    href: string;
}

/** The section's own tab row — the section's navbar, not the site's. The site
 * nav (SiteNav) is deliberately untouched. */
export const GOCAR_TABS: GocarTab[] = [
    { label: "Overview", href: "/gocar/" },
    { label: "Install", href: "/gocar/install/" },
    { label: "Commands", href: "/gocar/commands/" },
];

/** The published crate. The version is maintained by hand: crates.io is the
 * authority, and the pages link it rather than pretending to mirror it. */
export const GOCAR_CRATE = {
    name: "cargo-gocar",
    version: "0.5.0",
    published: "2026-09-10",
    cratesUrl: "https://crates.io/crates/cargo-gocar",
    install: "cargo install cargo-gocar",
    /** The crate's own one-line description, quoted from crates.io. */
    description: "structural, verified dependency resolution for gpui fork crates",
};

/** The published crate's facts, for the Overview's release table. The version
 * is maintained by hand — crates.io is the authority and this can lag it. */
export const GOCAR_RELEASE_FACTS: { label: string; value: string; href?: string }[] = [
    { label: "crate", value: GOCAR_CRATE.name },
    { label: "version", value: GOCAR_CRATE.version },
    { label: "published", value: GOCAR_CRATE.published },
    {
        label: "crates.io",
        value: "crates.io/crates/cargo-gocar",
        href: GOCAR_CRATE.cratesUrl,
    },
];

export interface GocarCommand {
    /** The command line, as the tool spells it. */
    line: string;
    /** The overview table's one-line cell. */
    what: string;
    /** The reference paragraph under the command, below the table. */
    details: string;
    /** Where the behaviour was measured or where its output is rendered. Doc
     * numbers are the fork map's study docs, which open in its reader. Absent
     * for commands no published study covers. */
    evidence?: { label: string; href: string };
    /** Which reference section it belongs to. */
    group: GocarGroupId;
}

/** The reference's four sections, which are the toolchain's own four stages:
 * it switches a project, reads the dataset it resolves against, audits the
 * result, and moves your code. The overview table keeps the same order, so it
 * reads top to bottom as the sections below. */
export type GocarGroupId = "switch" | "data" | "audit" | "code";

export const GOCAR_GROUPS: { id: GocarGroupId; title: string }[] = [
    { id: "switch", title: "Creating and switching projects" },
    { id: "data", title: "Reading the dataset" },
    { id: "audit", title: "Auditing the result" },
    { id: "code", title: "Moving your own code" },
];

/** A study doc in the fork map's reader (the map's hidden documents index —
 * `#/docs` is the index, `#/docs?doc=NN` opens one doc). Padded to the docs'
 * own numbering; the map resolves either form. */
export const mapDoc = (num: string): string =>
    `/map/#/docs?doc=${num.padStart(2, "0")}`;

export const GOCAR_COMMANDS: GocarCommand[] = [
    {
        line: "cargo gocar new <name> --provider <fork>",
        what: "Scaffolds a starter app bound to that fork, companion included.",
        details:
            "Writes the Cargo.toml and main.rs for a project bound to the fork you name — gpui-box, gpui-unofficial, kael, any provider the map carries — floored at that fork's latest stable. The two files are the era-correct binding unit: the engine plus the platform companion it is version-locked to, so the scaffold compiles as written instead of failing on a launch API the fork no longer has.",
        evidence: { label: "Configure view", href: "/map/#/configure" },
        group: "switch",
    },
    {
        line: "cargo gocar plan --provider <fork>",
        what: "Previews a switch — or a re-lock — as a manifest diff. Writes nothing.",
        details:
            "Prints the current binding beside the planned one, the Cargo.toml delta line by line, how the planned state resolves, and what that does to the lock. --equivalent plans the move onto the newest target release that measures the same interface as your binding; --compatible plans onto the newest release that keeps every symbol your app actually uses, which is the cheaper claim and the one that crosses forks. --check-usage refuses a target that would break your usage.",
        evidence: { label: "doc 07", href: mapDoc("7") },
        group: "switch",
    },
    {
        line: "cargo gocar add <fork>",
        what: "Rebinds the project to another fork, writing only the manifest delta.",
        details:
            "Moves the binding unit — the engine line plus the platform companion line it is version-locked to, the pair the platform split made one thing. --dry-run previews the same content as plan, --equivalent switches onto the newest release of the target that measures the same interface, and --compatible onto the newest release that keeps every symbol your app uses. Then run lock.",
        evidence: { label: "doc 07", href: mapDoc("7") },
        group: "switch",
    },
    {
        line: "cargo gocar lock",
        what: "Pins the resolved release and writes the proof of why it was chosen.",
        details:
            "Resolves the binding and pins both lines to an attested stable release rather than floating on a caret. A prerelease floor is refused by design, which is why a prerelease twin is reached through its stable-numbered row instead. It also writes .gocar/lock.proof — the ledger that answers \"why is this artifact in my lock?\", pairing the registry checksum with the measured reasoning.",
        evidence: { label: "doc 07", href: mapDoc("7") },
        group: "switch",
    },
    {
        line: "cargo gocar providers",
        what: "Lists the forks the dataset knows, with their latest stable and floors.",
        details:
            "Prints the dataset's schema, when it was last synced, which provider it recommends, and one row per fork: package, kind, latest stable, declared rust-version, measured generation and repository. It closes with how many versions carry a measured attestation and which fields are still null everywhere — an unmeasured field is reported as null, never guessed.",
        evidence: { label: "the Fork Map", href: "/map/" },
        group: "data",
    },
    {
        line: "cargo gocar resolve",
        what: "Runs the resolver for the current manifest and prints the artifact it chose.",
        details:
            "Writes nothing. Candidates are pruned on hard constraints — yanked, prerelease, below the floor, blocked by an attested toolchain floor, outside the recorded generation — then the oldest admissible release wins, and a measured patch chain is crawled up to the first measured break. The decision trail is printed line by line; it is the same reasoning a lock records.",
        group: "data",
    },
    {
        line: "cargo gocar export-fork-map",
        what: "Exports the measured dataset the Fork Map renders.",
        details:
            "Exports the dataset behind the Fork Map (the gocar.forkmap.manifest.v1 bundle): the measured items and digests, the item-set fingerprints that group releases into a generation, and the evidence each claim traces to. The viewer never re-derives tool semantics — everything it shows is a dataset field or a derivation the exporter did.",
        evidence: { label: "the Fork Map", href: "/map/" },
        group: "data",
    },
    {
        line: "cargo gocar check-workspace",
        what: "Catches a kit that drags a competing engine into the workspace.",
        details:
            "Audits the locked graph of a multi-package workspace. When a third-party kit pins a different engine transitively, it refuses the build and names both forks with their measured generations, so two graphics runtimes cannot be compiled into one binary. It names the fork, not the crate that dragged it in, and --strict also fails the rows it could not verify.",
        evidence: { label: "doc 10", href: mapDoc("10") },
        group: "audit",
    },
    {
        line: "cargo gocar verify-env",
        what: "Checks the binding and the graph; a second fork engine is a violation.",
        details:
            "Re-checks the binding against the environment. A second fork package anywhere in the graph is a rule violation and it exits 1 — the single-engine rule, enforced before the compiler has a chance to fail on the duplicate types. A release's declared compiler floor is advisory here (cargo is the gate that refuses the build); an attested one is enforced as a violation. --strict also fails on warnings.",
        evidence: { label: "doc 10", href: mapDoc("10") },
        group: "audit",
    },
    {
        line: "cargo gocar attest --local",
        what: "Writes offline receipts for the measured packages in your lock.",
        details:
            "For every locked package the dataset has measured, it writes a receipt carrying that release's measured fingerprint, surface digest, attested toolchain floor and the record it came from. It runs entirely offline and never invents a hash: a field the dataset does not carry stays null. verify-env re-derives the receipts, so a drifted one is a violation. Needs a Cargo.lock — run lock first.",
        group: "audit",
    },
    {
        line: "cargo gocar report",
        what: "Measures your app's used API against every measured release.",
        details:
            "Reads the app's own source, takes the slice of GPUI it actually uses, and compares that slice against every measured release: the compatible windows it prints, and the exact release each removal lands in. Method chains on elements stay outside the scan, so those sites are yours to review.",
        evidence: { label: "doc 08", href: mapDoc("8") },
        group: "code",
    },
    {
        line: "cargo gocar migrate --provider <fork>",
        what: "Rewrites the call sites a cross-generation move breaks, from confirmed rules only.",
        details:
            "The flip side of report: where the report names which used symbols a target removed and at which sites, migrate applies the rule store's human-confirmed renames as source edits and leaves everything it did not touch byte-identical. Every checkable symbol is sorted into kept, rewrites, or manual — a re-signed symbol, or a removal with no confirmed rule, is manual with its reason. It does not move the binding; add and lock close the loop. Treat a planned rewrite as code to review and compile: the study that ran the real profiler rewrite found the renamed call did not build, because the successor sits behind a non-default feature.",
        evidence: { label: "doc 09", href: mapDoc("9") },
        group: "code",
    },
    {
        line: "cargo gocar facade --emit <dir>",
        what: "Emits a managed crate that keeps the old names compiling while you move.",
        details:
            "The other half of migrate: where migrate rewrites your call sites when you are ready, the facade keeps the shapes you have compiling meanwhile — the same confirmed rules, two consumers. The emitted crate is itself the gocar-managed project: it binds the fork under the ordinary gpui key and mirrors the measured surface, so your app depends on it instead of the engine and never changes when the engine does. It generates only the shims whose measured parameter types forward mechanically, refusing the rest by name with the reason rather than dropping them. --dry-run previews; --check exits 1 when the emitted facade has fallen behind the binding.",
        evidence: { label: "doc 09", href: mapDoc("9") },
        group: "code",
    },
];
