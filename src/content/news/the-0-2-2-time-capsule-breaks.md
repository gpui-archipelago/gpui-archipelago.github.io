---
title: "The 0.2.2 Time Capsule Breaks"
date: 2026-11-03
description: "A year-old gpui 0.2.2 on crates.io collides with libc's removal of ENOATTR, breaking cargo add gpui builds on Linux — and why patching around it is the wrong fix."
tags: ["dispatch"]
---

Every few days, someone new drops into the Discord channels with the exact same question. They heard about GPUI, ran `cargo add gpui` on a Linux machine, tried to compile a basic window, and immediately hit a wall:

```text
error[E0425]: cannot find value `ENOATTR` in crate `::libc`
   --> .../.cargo/registry/src/.../xattr-0.2.3/src/sys/mod.rs:12:56
    |
 12 |               pub const ENOATTR: ::libc::c_int = ::libc::ENOATTR;
    |                                                          ^^^^^^^
```

If you just hit this, you aren’t doing anything wrong. You just stumbled into the side effects of a year-old crate colliding with the rest of the Rust ecosystem moving on.

## What actually broke

When you run `cargo add gpui` without any extra configuration, Cargo fetches version `0.2.2` from crates.io. Because most people don’t check publication dates when running `cargo add`, it is easy to miss that `0.2.2` is nearly a year old.

Back when Zed published `0.2.2`, its dependency tree pulled in `xattr 0.2.3` (via `http_client` and `async-tar`). At the time, `xattr 0.2.3` relied on `libc::ENOATTR` on Linux. Since then, `libc` (`0.2.190`+) cleaned house and finally removed `ENOATTR` on Linux, which had been deprecated for years in favor of `ENODATA`.

Because Cargo resolves `libc` to the latest compatible `0.2.x` version (`0.2.190` or `0.2.191`) alongside the ancient `xattr 0.2.3` required by `gpui 0.2.2`, the build blows up before it even reaches GPUI’s own code.

## The duct-tape fixes

If you want to stay on `0.2.2` (or if you even hit this via `async-tar` on an older Git pin), people have been passing around two main workarounds in chat:

- **Lock down `libc`:** Run `cargo update -p libc --precise 0.2.189` to force your `Cargo.lock` back to the last version of `libc` that still carried the deprecated constant.
- **Upgrade `xattr`:** Force `xattr` to `1.x` in your dependency tree, where the Linux constant was fixed.

Both beat manually editing files inside your local `.cargo/registry` cache — which works right up until you run `cargo clean` or switch machines.

## The real fix: don’t use `0.2.2`

The bigger takeaway from the `xattr` crash isn’t about `libc` or Cargo’s SemVer quirks — it’s that the official `gpui` crate on crates.io is a time capsule.

Even after you patch past `xattr`, staying on `0.2.2` means building against an engine that is a year behind upstream and incompatible with the current ecosystem. And because `gpui.rs` and standard Cargo workflows still funnel newcomers straight into `cargo add gpui`, `0.2.2` acts as an accidental trapdoor for anyone trying the framework for the first time.

Until Zed’s automated crates.io publishing pipeline actually materializes, your first step when starting a GPUI project is picking a current distribution:

- **[`gpui-unofficial`](https://crates.io/crates/gpui-unofficial):** The closest thing to what `cargo add gpui` *should* do. It mirrors upstream Zed releases to crates.io (currently past its 65th release) so you get a current, vanilla GPUI without living on raw Git commits.
- **[`gpui-kit`](https://crates.io/crates/gpui-kit) / [`gpui-pre`](https://crates.io/crates/gpui-pre):** Longbridge’s distribution and component suite, which tracks bleeding-edge upstream and ships with a ready-made widget library if you want to build an app today.
- **Community forks ([`gpui-ce`](https://crates.io/crates/gpui-ce), [WGPUI](https://github.com/Far-Beyond-Pulsar/WGPUI), [Kael](https://github.com/Augani/kael)):** If you want a standalone community release cycle, a unified `wgpu` backend, or built-in webviews and form controls.

If `ENOATTR` is what brought you here, consider it an early warning from the compiler. Skip the year-old crate, pick an active island, and start from there.
