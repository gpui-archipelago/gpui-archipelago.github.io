---
title: "The Retained Frame: Two Islands, One Engine, and the Spliced Buffer"
date: 2026-09-28
description: "Zed's persistent ViewTree and Longbridge's gpui-fast fork both set out to make GPUI render incrementally — the persistent-node spine versus flat-buffer splicing, and what the archipelago should take from each."
tags: ["dispatch"]
---

Immediate-mode UI has a dirty secret that every production app eventually confronts: rebuilding an entire element tree from scratch every frame is a tremendous waste of silicon.

Upstream GPUI has survived on sheer speed for years. But its evaluation curve has always been flat. Whether you type a single character into an editor buffer or drag a pane boundary, a frame on upstream `main` costs almost exactly what a full refresh costs.

Over the last month, two separate teams dropped anchor on opposite shores of this problem to bend that curve.

On one side sits Mikayla Maki’s view tree overhaul inside upstream Zed (`#63800`, with the measurement harness arriving separately as `#64842`). On the other sits `gpui-fast`, an aggressive downstream effort from Longbridge authored predominantly by `sunli829` and opened and merged by `huacnlee` (starting with PR `#2` on September 28).

Both projects set out to solve the exact same problem: **incremental view rendering**. If an entity hasn't changed, don't run `render()`, don't lay it out in Taffy, don't re-shape its text, and don't re-rasterize its primitives.

Yet under the hood, the two architectures look like they were built on different planets. One is a principled compiler spine; the other is a pragmatic set of hooks performing buffer surgery in a fork.

## The Common Ground

Before looking at where they split, it helps to see what both teams independently proved you cannot compromise on:

1. **A complete redraw is the ground truth.** Both projects test accuracy by comparing an updated frame against one drawn completely from scratch (`window.refresh()`). The check isn't pixel-level: Zed asserts that a scene-description string and a dispatch-tree snapshot match; its true pixel oracle exists but is `#[ignore]`d behind a Metal device; `gpui-fast`'s `gpui_perf --verify` compares quads, explicitly *not* text sprites or paths.
2. **Text shaping and Taffy subtrees are what actually eat frame time.** Element allocation in memory is cheap. Laying out boxes and shaping fonts over and over is where GPUI actually bleeds cycles. Both engines keep Taffy subtrees and shaped line caches alive across frames.
3. **Reads dictate dirtiness.** If a view reads an entity during evaluation, it registers a dependency, and a change to that dependency dirties the view. Even here the two part ways: Zed records a per-node read set and expands a reverse `consumers` map at frame start, while `gpui-fast` tracks dependencies per subtree (nested `all`/`own`) and logs three kinds: entities, globals gated by a monotonic `global_generation`, and `StateVersion`-stamped shared state (`ScrollHandle`, `ListState`).

Past that, the alignment ends entirely. The moment you look at *how* identity is maintained across frames, the paths diverge completely.

## Approach A: The Zed View Tree (`#63800`)

*The in-tree compiler pass: persistent nodes, internal memoization, clean lifecycle.*

Mikayla’s approach treats GPUI as a formal compiler pass with an explicit intermediate representation: the `ViewTree`.

Views no longer vanish at the end of every frame. Instead, Zed introduces a persistent `SlotMap<ViewNodeId, ViewNode>`. Each mounted occurrence of a view gets a persistent node. That node directly owns its layout subtree (`Option<LayoutId>`), its dependency sets, and its rendered output (`NodeOutput`: per-phase `Vec<OutputItem>`, a scene record, and dispatch nodes, not a flat slice).

```
[ Window::draw ]
       │
       ▼
 [ ViewTree Walk ] ──── (Clean?) ──► Graft existing Layout & Replay Scene Cursors
       │
    (Dirty)
       ▼
 Re-render View ──► Store Layout ──► Record new lane primitives
```

The walk makes a per-node graft decision—whether the retained layout still stands (`retained_layout_unchanged`)—and for dirty nodes writes the fresh output back onto the node (`store_node_render`).

### What makes it work:

- **Structural Integrity:** The node is stable: a `SlotMap` entry that owns its Taffy subtree root outright rather than looking it up by hash. The element path still hashes each frame (a running hash pushed with the id stack, `Window::element_path_hash`) to locate the node's occurrence; what's durable is the node and its `LayoutId`, not the absence of hashing.
- **The Frame as Scene Cache:** The previous rendered frame *is* the cache. Primitives are written once into paint-order lanes; a clean node records its lane start cursors, and replay gathers them from the previous frame. It still copies those primitives into the new frame's lanes and index-sorts keys in `Scene::finish`—cheap, but not zero-copy.
- **Root Discipline:** Deferred popovers, tooltips, and modals are tracked as an ordered list of roots tied to node outputs. If a parent view is replayed clean, its popover root re-attaches deterministically.

### Where it pays the toll:

It is an invasive architectural shift. It introduces a brand new public `Component` trait, seals `View`, and reorganizes internal rendering passes. It has required Zed to land half a dozen preparatory PRs (`#64753`, `#64843`, `#64842`, `#64718`) just to lay the pavement—and as of this writing the view tree itself is still off `main`, on a closed draft branch rather than a merged feature.

## Approach B: `gpui-fast` (`longbridge/gpui-fast`)

*The downstream fork: zero new public API, strict budgets, and flat buffer surgery.*

Longbridge didn't wait for Zed's months-long upstream refactor. Their dense data tables couldn't afford to keep burning CPU on every frame.

Authored predominantly by `sunli829`, `gpui-fast` was engineered around a hard mechanical constraint: **change upstream GPUI as little as humanly possible, and add zero new public APIs.**

Instead of building a persistent `ViewTree`, `gpui-fast` isolates its machinery in an external `fast/` directory, piping into GPUI via sparse, one-line hooks in files like `window.rs` and `view.rs`.

```
[ Frame Walk ]
       │
 [ View Boundary ] ─── (RenderDependencies Clean?)
       │                                │
    (Dirty)                          (Clean)
       ▼                                ▼
 Render & Log Reads           Copy Subtree Record &
 into Scoped Stack           Shift Primitives into Scene
                                        │
                               (Child Dirty in Gap?)
                                        ▼
                             fast/splice.rs buffer surgery
```

### What makes it work:

- **Zero API Footprint:** Downstream application code doesn't need to know `gpui-fast` exists. Any view—whether wrapped in `.cached()` or completely plain—is automatically retained if its dependencies haven't moved.
- **Pragmatic Invalidation:** Zed requires strict adherence to `cx.notify()`. `gpui-fast` takes a more forgiving stance: any `entity.update(..)` call outside of drawing increments an update generation that invalidates reading views automatically.
- **Maintainability Budgets:** The fork enforces a strict CI check (`script/check-upstream`) that fails if any tracked upstream file adds more than 40 lines or if any hook exceeds 8 lines. It is built to rebase on upstream commits without merge conflicts spilling everywhere.

### Where it pays the toll:

Because `gpui-fast` avoids persistent node structs, it has no stable handles for element locations. It has to re-derive element identity on every frame by calculating a running `SplitMix64` hash of the ancestor path (`fast/layout_key.rs`).

Worse, when a nested child inside a clean parent invalidates, `gpui-fast` cannot just replay the parent and re-run the child at a node slot. It has to invoke `fast/splice.rs`—an elaborate piece of flat-buffer surgery that copies the parent's primitive records from the previous frame, cuts a physical hole in the operation stream, builds the child inside the gap, and shifts the surrounding index offsets.

## Direct Comparison: The Tale of the Tape

| Dimension | A — Zed View Tree (`#63800`) | B — `gpui-fast` (`longbridge/gpui-fast`) |
| --- | --- | --- |
| **Spine Architecture** | Persistent `ViewTree` using `SlotMap` nodes | Ephemeral; flat per-subtree records re-derived per frame |
| **View Identity** | Fixed node occurrence key | Running 64-bit element-path hash (`layout_key.rs`) |
| **Splicing Dirty Children** | Replay parent node; dispatch child at its node | `fast/splice.rs` flat-buffer surgery and memory shifting |
| **Scene Invalidation** | Rendered frame as lane cache; cursor gather | Balanced bounds tree replaying cached operation stream |
| **`update(..)` without `notify()`** | Ignored (contract violation) | Triggers rebuild (defensive real-world heuristic) |
| **Public API Additions** | `gpui::Component`, `ViewTreeStats` | **None** (100% drop-in upstream compatible) |
| **Runtime Controls** | Default-on (forced full refresh escape hatch) | `GPUI_VIEW_RETENTION=0` runtime environment switch |
| **Code Footprint** | In-tree rewrite (+9,212 / −1,256 across 48 files) | Modular `fast/` tree + strictly budgeted 1-line upstream hooks |

## The Receipts

Longbridge published dramatic benchmarks for `gpui-fast`: an idle window dropped CPU usage by **94%**, lists dropped by **66%**, and a dense 60-panel test dropped frame times from **10.43 ms down to 0.25 ms**.

Those numbers are real, but they are also Longbridge’s numbers run on Longbridge’s fork. The critical takeaways made by both projects, however, are structural:

1. **Unbalanced bounds trees will kill you.** Early in `gpui-fast`, copying cached primitives into upstream’s unbalanced bounds tree wiped out retention gains—taking 3.3 ms just to re-index a still frame. Switching to a balanced bounds tree dropped that to 0.31 ms.
2. **Orphan layouts leak.** Zed found that layout roots evaluated during prepaint (`layout_as_root`, editor blocks, list rows) bypass standard node retirement. Without frame-scoped cleanup, Taffy leaks one tree per item per frame until a full refresh.

## The Synthesis: What a Clean Engine Actually Wants

If you were building the ideal retained GPUI engine on a clean sheet of paper, you wouldn't pick exclusively from Column A or Column B. You would take **Zed’s spine and Longbridge’s receipts**:

- **Take Zed’s persistent node spine.** Relying on `fast/splice.rs` to carve holes in flat byte streams is an impressive workaround, but it exists solely to avoid modifying upstream structs. Both engines hash the ancestor path; the difference is that Zed re-checks the full occurrence path on a hash hit (`ViewOccurrence`) to rule out a collision, while `gpui-fast` trusts its `u64` outright. A `SlotMap` of nodes that own their `LayoutId` lets you keep that collision check and drop the buffer splicing.
- **Keep Longbridge’s public surface discipline.** You don't need a brand new `Component` trait to make retained rendering work. Keep the public surface untouched so downstream UI components compile cleanly across both engines.
- **Adopt Longbridge's ambient dependency awareness.** Tracking hovers, bounds shifts, and versioned scroll state (`ScrollHandle`, `ListState`) as first-class dependencies prevents subtle cache-invalidation tearing that pure entity read-sets miss.
- **Steal the balanced bounds replay.** Do not re-sort clean primitives into empty trees. Replay the sorted lanes directly.

## The View from the Archipelago

The standoff here is classic GPUI: two teams tackling the hardest runtime problem in the ecosystem in parallel silos.

Longbridge had to build `gpui-fast` because their product couldn't wait on Zed's months-long upstream compiler refactor. Zed built `#63800` because they want a clean, formal foundation for the core editor.

If you are maintaining an independent fork or building a standalone app today, you don't need to invent Approach C. Watch upstream's harness commits (`#64842`) and whether the view-tree branch (`#63800`) revives, see how `gpui-fast` survives its rebases, and choose whose harbor you want to anchor in.

One island built the scaffolding; the other carved the tunnel. Eventually, the tide is going to force them together.
