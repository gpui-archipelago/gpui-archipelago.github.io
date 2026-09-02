---
title: "The GPUI Distribution Problem"
date: 2026-09-02
description: "Building with GPUI outside of Zed means wrangling Cargo over arbitrary Git commits — a look at the workarounds people improvise, and why a shared map is what's actually missing."
tags: ["overview"]
---

Trying to build with GPUI outside of Zed is a messy experience, mostly because GPUI was never designed to be a standalone product. Zed develops it directly inside their monorepo for their own editor. After briefly publishing crates to crates.io, they hit pause, and everyone building on top of it has had to improvise ever since.

Because Cargo treats every 0.x bump as a breaking change, and because third-party libraries pin to arbitrary Git commits, your dependency graph splinters immediately. If your project and an add-on library point to different Git commits of GPUI, Cargo compiles two separate copies of the engine into your binary. You end up staring at compiler errors like `expected gpui::WindowContext, found gpui::WindowContext`, or watching the build blow up because traits implemented for one commit aren't recognized by another. People end up trading `[patch.crates-io]` snippets in Discord channels just to force every dependency onto the exact same Git hash.

On top of that, internal crates like `gpui` and `gpui-platform` have tangled, mutual dependencies. When downstream libraries start renaming packages or pulling from mirrors like `gpui-unofficial`, Cargo's resolver can quickly paint itself into a corner.

## Parallel Work in Silos

To deal with this, people end up building some pretty elaborate scaffolding. Take [gpui-binder](https://github.com/gpui-binder/gpui-binder), for example: it's an entire GitHub Actions automation setup designed to continuously pull the latest GPUI code from Zed and bundle it alongside downstream libraries like [gpui-component](https://github.com/longbridge/gpui-component) into a unified workspace. Inside that workspace, the author added gpui-facade—a dedicated helper crate that merges `gpui` and `gpui-platform` into a single namespace so you don't have to spend your weekend untangling their mutual dependencies. Meanwhile, in the comments of the Reddit thread where that was shared, other developers are trading `[patch.crates-io]` snippets, trying to figure out why crate mirrors won't compile, and hacking together their own workarounds.

Nobody is doing anything wrong here. Everyone is just trying to get a UI on the screen, but they're doing it in isolation, running into the exact same walls on slightly different timelines.

## The Workarounds Today

Right now, developers deal with this in a few distinct ways:

- **Hard forking:** Projects like [Kael](https://github.com/Augani/kael) or [WGPUI](https://github.com/Far-Beyond-Pulsar/WGPUI) split off entirely, set their own versioning, and move on. It gives you total control and clean builds, but you are entirely on your own. Any bug fix or rendering improvement Zed makes upstream has to be manually ported over by hand.
- **Republishing mirrors:** Crates like [gpui-unofficial](https://crates.io/crates/gpui-unofficial) grab upstream tags and push them to crates.io so `cargo add` works normally again. It fixes the immediate friction, but downstream projects are still relying on a single maintainer to keep pace with upstream changes.
- **Community-run forks:** Projects like [gpui-ce](https://github.com/gpui-ce/gpui-ce) spread the maintenance load across a group of contributors, which reduces burnout, though keeping up with upstream churn remains a heavy lift.
- **Living on raw Git:** Pointing directly to Git repositories skips release overhead, but it quickly falls apart when dependencies drift and you end up with multiple incompatible GPUI instances compiled into your binary.
- **Shared patch sets:** There is an idea around passing modular patches between forks rather than maintaining whole separate codebases. As [Nate Butler](https://github.com/iamnbutler) has pointed out, though, if you genuinely want to take the engine in a new direction, a clean fork is usually the only practical path. Trying to keep patches portable across diverging codebases requires more cross-team coordination than most small projects can sustain.

## Why Not Just Make It Official?

There is an obvious fix staring everyone in the face: make the unofficial crate official. [gpui-unofficial](https://crates.io/crates/gpui-unofficial) fills the exact gap Zed left behind, yet it struggles with community adoption precisely because of its unofficialness — teams hesitate to build on a package that might change names or ownership again. If the official `gpui` crate on crates.io were current, the stale-crate problem, the piles of git url + rev combinations, and the mirror's adoption ceiling would all dissolve at once.

But official is a promise, not a rename. It drags in governance, official release notes, a versioning policy, and SemVer guarantees — sustained work the Zed team doesn't have bandwidth for. So nothing gets blessed, and the ecosystem settles into its current shape: one stale official crate, several published and unpublished fork crates, and everyone else pointing Cargo at arbitrary git commits.

## Where the Archipelago Fits

That is where something like [gpui-archipelago](https://github.com/gpui-archipelago) fits. It should not try to be another competing fork, nor should it try to force everyone onto a single standard. People are going to fork the engine for their own specific needs, and that is completely natural.

What is actually missing is a shared, updated notebook of what already exists. If someone hits duplicate-crate errors, wants to know which forks are actively maintained, or is trying to figure out how gpui-binder differs from gpui-facade, they should not have to dig through months of old chat logs to find an answer. It is not about building another fork—it is just drawing a clear map of the ones people are already using.
