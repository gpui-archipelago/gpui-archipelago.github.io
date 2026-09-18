// The Gocar section's facts, kept next to the markup that renders them (the
// same pattern as fork-status.ts).
//
// Everything here is sourced rather than invented: the crate facts come from
// the crates.io API for `cargo-gocar`, and each command line is one the fork
// map already names. The descriptions are the studies' own wording (docs
// 07-12), which is where the behaviour was measured against real crates.io
// artifacts.

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
    /** Where the behaviour was measured. Doc numbers are the fork map's study
     * docs, which open in its reader. */
    evidence: { label: string; href: string };
    /** Which reference section it belongs to. */
    group: GocarGroupId;
}

/** The reference's three sections. The overview table keeps the tool's own
 * order (`GOCAR_COMMANDS`); this only groups it for the prose below. */
export type GocarGroupId = "create" | "audit" | "upgrade";

export const GOCAR_GROUPS: { id: GocarGroupId; title: string }[] = [
    { id: "create", title: "Creating and configuring projects" },
    { id: "audit", title: "Auditing and dependency protection" },
    { id: "upgrade", title: "Analysing code and planning upgrades" },
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
        evidence: { label: "the map's Configure view", href: "/map/#/configure" },
        group: "create",
    },
    {
        line: "cargo gocar lock",
        what: "Pins dependencies to a measured stable release; refuses a prerelease floor.",
        details:
            "Resolves the binding and pins both lines to an attested stable release rather than floating on a caret. A prerelease floor is refused by design, which is why a prerelease twin is reached through its stable-numbered row instead.",
        evidence: { label: "doc 07", href: mapDoc("7") },
        group: "create",
    },
    {
        line: "cargo gocar verify-env",
        what: "Checks the binding and the graph; a second fork engine is a violation.",
        details:
            "Re-checks the binding against the environment. A second fork package anywhere in the graph is a rule violation and it exits 1 — the single-engine rule, enforced before the compiler has a chance to fail on the duplicate types.",
        evidence: { label: "doc 10", href: mapDoc("10") },
        group: "audit",
    },
    {
        line: "cargo gocar check-workspace",
        what: "Catches a kit that drags a competing engine into the workspace.",
        details:
            "Audits the locked graph of a multi-package workspace. When a third-party kit pins a different engine transitively, it refuses the build and names both forks with their measured generations, so two graphics runtimes cannot be compiled into one binary. It names the fork, not the crate that dragged it in.",
        evidence: { label: "doc 10", href: mapDoc("10") },
        group: "audit",
    },
    {
        line: "cargo gocar report",
        what: "Measures your app's used API against every measured release.",
        details:
            "Reads the app's own source, takes the slice of GPUI it actually uses, and compares that slice against every measured release: the compatible windows it prints, and the exact release each removal lands in. Method chains on elements stay outside the scan, so those sites are yours to review.",
        evidence: { label: "doc 08", href: mapDoc("8") },
        group: "upgrade",
    },
    {
        line: "cargo gocar add <package>",
        what: "Adds a package through the resolved-and-verified path.",
        details:
            "Adds a dependency to the project and keeps the binding resolved and verified. Passed --equivalent it swaps the current engine for a fork of the same measured generation, moving the engine and its companion together in a single diff.",
        evidence: { label: "doc 07", href: mapDoc("7") },
        group: "create",
    },
    {
        line: "cargo gocar facade",
        what: "Prints the compatibility shims a release carries.",
        details:
            "Prints the facade table for a bound release — the compatibility shims and deprecated aliases that keep a call site compiling while you move it by hand. Read it against the target release: bound to the baseline it reports nothing, and a missing shim means no rule, not no break.",
        evidence: { label: "doc 09", href: mapDoc("9") },
        group: "upgrade",
    },
    {
        line: "cargo gocar export-fork-map",
        what: "Exports the measured dataset the Fork Map renders.",
        details:
            "Exports the dataset behind the Fork Map (the gocar.forkmap.manifest.v1 bundle): the measured items and digests, the item-set fingerprints that group releases into a generation, and the evidence each claim traces to.",
        evidence: { label: "the Fork Map", href: "/map/" },
        group: "upgrade",
    },
];
