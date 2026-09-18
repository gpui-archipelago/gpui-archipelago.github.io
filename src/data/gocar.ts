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

export interface GocarCommand {
    line: string;
    what: string;
    /** Where the behaviour was measured. Doc numbers are the fork map's study
     * docs, which open in its reader. */
    evidence: { label: string; href: string };
}

/** A study doc in the fork map's reader (the map's hidden documents index —
 * `#/docs` is the index, `#/docs?doc=NN` opens one doc). Padded to the docs'
 * own numbering; the map resolves either form. */
export const mapDoc = (num: string): string =>
    `/map/#/docs?doc=${num.padStart(2, "0")}`;

export const GOCAR_COMMANDS: GocarCommand[] = [
    {
        line: "cargo gocar new <name> --provider <fork>",
        what: "Writes the Cargo.toml and main.rs for a project bound to that fork, floored at the fork's latest stable.",
        evidence: { label: "the map's Configure view", href: "/map/#/configure" },
    },
    {
        line: "cargo gocar lock",
        what: "Pins the artifact to the measured release. Refuses a prerelease floor by design.",
        evidence: { label: "doc 07", href: mapDoc("7") },
    },
    {
        line: "cargo gocar verify-env",
        what: "Checks the environment against the binding: a second fork in the graph is a violation, and it exits 1.",
        evidence: { label: "doc 10", href: mapDoc("10") },
    },
    {
        line: "cargo gocar check-workspace",
        what: "Audits a workspace: refuses a kit whose fork is pinned transitively, naming the fork and both measured generations.",
        evidence: { label: "doc 10", href: mapDoc("10") },
    },
    {
        line: "cargo gocar report",
        what: "Checks an app's used-API slice against every measured release and prints compatible windows plus exact incompatibilities.",
        evidence: { label: "doc 08", href: mapDoc("8") },
    },
    {
        line: "cargo gocar add <package>",
        what: "Adds a dependency through the same resolved-and-verified path.",
        evidence: { label: "doc 07", href: mapDoc("7") },
    },
    {
        line: "cargo gocar facade",
        what: "The facade table for a bound release — the decision aid for a site the tool declines to move.",
        evidence: { label: "doc 09", href: mapDoc("9") },
    },
    {
        line: "cargo gocar export-fork-map",
        what: "Exports the measured dataset the Fork Map renders (bundle gocar.forkmap.manifest.v1).",
        evidence: { label: "the Fork Map", href: "/map/" },
    },
];
