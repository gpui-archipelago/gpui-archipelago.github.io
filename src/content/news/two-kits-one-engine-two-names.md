---
title: "Two kits, one engine, two names"
date: 2026-09-07
description: "One engine, two crates.io names: how a one-line re-export shim under Cargo's [patch] makes gpui-pre and gpui-unofficial interchangeable — and what still breaks between them."
tags: ["showcase"]
---

`gpui-kit`, the longbridge facade, depends on `gpui-pre`. `gpuikit`, Nate Butler's toolkit, depends on `gpui-unofficial`. Different maintainers, different crates.io names. If you'd asked me a week ago whether these two things ran on the same engine, I'd have said probably not.

I checked. Same engine. `gpui-pre` 0.3.x and `gpui-unofficial` 1.19.0-pre expose the same public items and the same function signatures, item for item. I compared the two crates directly instead of guessing from version numbers, because guessing is how you end up with two copies of the same engine compiled into one binary and a stack trace that makes no sense.

## How you get here

GPUI doesn't ship on a schedule anyone can plan around, so people building on top of it have solved the crates.io problem more than once, separately. `gpui-unofficial` is Nate's answer. `gpui-pre` is Jason's, done later, under more pressure, without reaching for the mirror that already existed. Both are reasonable on their own. Now the same code has two names, and Cargo has no way to tell you that — it checks names and version numbers, not what's inside.

A kit built against one name can't touch a component built against the other. Even when the two names point at identical code.

## The bridge

Cargo's `[patch]` will swap in a replacement crate only if the name and version match. It won't let you tell it "these are the same thing under different names." But the replacement doesn't have to contain the original crate's code — it just has to satisfy the name.

A crate named `gpui-pre`, version 0.3.3, containing one line — `pub use gpui_unofficial::*;` — passes Cargo's check. What actually compiles is unofficial's code. Everything downstream that pulls in `gpui-pre` — the kit, its platform crate, gpui-component — ends up compiling against unofficial and never notices. Same trick backwards: a crate named `gpui-unofficial` whose body is `pub use gpui_pre::*;`.

Either direction, you end up with one copy of the engine in the dependency graph, no matter which name got you there.

## What compiled

| App | Depends on | Actually compiles against | Result |
|---|---|---|---|
| gpui-kit app | `gpui-pre` | `gpui-unofficial` 1.19.0-pre | builds, kit untouched |
| gpuikit app | `gpui-unofficial` | `gpui-pre` 0.3.3 | builds, one call site fixed |

`cargo tree` shows one engine in each graph. A kit widget sitting next to the app's own GPUI calls compiles fine — same compiled crate, not two crates that happen to look alike.

## Where it broke

Somewhere between the unofficial version gpuikit was written against and 1.19.0-pre, `Window::blur` picked up a second argument. It clears pending keystrokes now, not just focus, so it needs the app context. gpuikit's one call site was written for the old signature. I fixed it and sent a patch upstream so gpuikit can carry both versions behind a feature flag for a while.

Separate small annoyance: 1.19.0-pre is a prerelease. gpuikit's own caret dependency won't pull in a prerelease on its own, so for now you need an exact pin. Once 1.19.0 ships as a normal release this stops being anyone's problem.

## What I actually checked, and what I didn't

The item comparison covers what each crate exposes publicly. It doesn't cover feature-gated code, and it isn't a compiler-verified proof — I compared item lists and signatures, not everything a full type check would catch. Both real app stacks compiling cleanly is a second, independent piece of evidence, and that held too. I'm saying this because half the compatibility claims that circulate in this ecosystem right now are somebody's guess dressed up as a fact, and I'd rather this one not be mistaken for the same thing.

## Why bother writing this up

Jason and Nate haven't talked about this, as far as I know, and don't need to. The two kits were already running the same engine before either of them decided the other's naming was wrong. Whoever you pick, you're not choosing an engine. You're choosing which name to type into Cargo.toml.
