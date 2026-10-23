---
title: "This Month in GPUI"
date: 2026-10-23
description: "September and October in the GPUI ecosystem: upstream v1.18–v1.25, retained-frame rendering, the bite-gpui five-layer split, GPU surface interop, and the crates.io distribution map."
tags: ["digest"]
---

September and October brought major architectural movement across the GPUI ecosystem. Upstream Zed shipped eight stable releases (v1.18.0 through v1.25.2) and opened the v1.26.1-pre cycle, while community and downstream teams delivered incremental retained-frame rendering, a five-crate modular engine split, cross-API GPU surface sharing, and new crates.io distribution channels.

## The GPUI Archipelago & Release Channels

As official crates.io publishing remained frozen at 0.2.2 past the 315-day mark, ecosystem stewardship and distribution tooling expanded across multiple fronts.

- **`gpui-unofficial` joins the archipelago.** Nate Butler’s automated upstream mirror ([`gpui-unofficial`](https://github.com/gpui-archipelago/gpui-unofficial) and its companion platform crates) is now officially part of the [gpui-archipelago](https://github.com/gpui-archipelago) organization. Its pipeline checks upstream Zed every six hours, applies documented manifest and source transforms (`upstream-patches.md`), and publishes verbatim Zed tag versions to [crates.io](https://crates.io/crates/gpui-unofficial) (currently v1.25.2).
- **The 315-day vacuum and upstream promises.** After 315 days and 523 commits without an official crates.io release, Longbridge maintainer Jason Lee republished Zed’s GPUI crates under the [`gpui-pre`](https://crates.io/crates/gpui-pre) namespace alongside a unified [`gpui-kit`](https://crates.io/crates/gpui-kit) facade. In response, Zed publicly committed — again — to an automated crates.io release pipeline by the end of September, though that target passed without an official release. The full story is in [The 315-Day Vacuum](/news/315-day-vacuum/).
- **Cargo `[patch]` interoperability.** Direct API comparisons confirmed that corresponding versions of `gpui-pre` and `gpui-unofficial` expose identical public items and function signatures. Downstream apps mixing libraries from both ecosystems (`gpui-kit` and `gpuikit`) can unify their dependency graphs into a single compiled engine using a one-line `pub use` re-export shim under Cargo’s `[patch.crates-io]`; see [Two kits, one engine, two names](/news/two-kits-one-engine-two-names/).

## Upstream Highlights: v1.18.0 through v1.25.2

With upstream now advancing into v1.26.1-pre, GPUI received upgrades across frame pacing, touch input, headless rendering, and diagnostics.

### Frame Pacing, Diagnostics & Hang Monitoring

- **Per-window refresh-rate pacing (v1.25.2):** GPUI now tracks connected displays and each window’s active display, measuring frame-pacing budgets against that monitor’s refresh rate.
- **Demand-driven Wayland loop (v1.18.0):** The Wayland render loop is demand-driven, eliminating idle frame wakeups at the display’s refresh rate and fixing fullscreen UI freezes.
- **Unpaced render sessions and visibility APIs (v1.21.0):** Added unpaced frame-driven renderer sessions for benchmarking alongside `Window::is_visible` and `Window::on_visibility_changed`.
- **GPUI-owned hang monitor (v1.19.2–v1.24.2):** Hang detection moved into a GPUI-owned monitor with a 24 ms release frame budget, backed by `ForegroundJournal` to log between-frame executor work while ignoring intervals skewed by system sleep or hidden windows.
- **Inspector optimization (v1.22.0, v1.24.2):** Reduced the debug inspector’s runtime cost by an order of magnitude and restricted debug selector recording to debug builds.

### Touch Input, Gestures & Scroll Physics

- **Touch event primitives (v1.19.2, v1.20.1):** Added `TouchEvent` and `TouchDragEvent` APIs alongside touch-mispredict jitter prevention.
- **Dominant-axis lock and scroll physics (v1.19.2):** Touch scrolling now locks to the dominant movement axis and uses platform-specific scroll physics.
- **Long-press gestures (v1.19.2, v1.21.0):** Added long-press gesture recognition and wired it up to activate tooltips on touch devices.
- **Hover and hit-testing refinements (v1.20.1):** Added `Hitbox::is_hovered_at` and an option to keep hover listeners active during keyboard input.

### Headless Rendering, Layout & Typography

- **Cross-platform headless windowing (v1.18.0–v1.24.2):** Unified headless rendering behind a cross-platform headless windowing API, adding Linux headless rendering in `gpui_wgpu` (v1.23.2), `render_to_image` window capture on Windows (v1.18.0), and Metal object leak fixes on macOS (v1.21.0).
- **Benchmarking and test support (v1.18.0–v1.24.2):** Separated benchmark support from `test-support`, made `test-support` safe to enable in all builds, added scale-factor simulation to `TestWindow` (v1.20.1), and landed `bench_metrics` with seeded randomized element-tree benchmarks and heap allocation tracking (v1.23.2).
- **Layout and element IDs (v1.19.2–v1.25.2):** Hashed `GlobalElementId` once at construction time (v1.24.2), fixed `uniform_list` item layout drift far down long lists (v1.25.2), and snapped recomputed padding to the device pixel grid before clamping scroll (v1.19.2).
- **Typography and line shaping (v1.18.0, v1.21.0):** Added `ShapedLineCursor`, split and paint APIs on `LineLayout`, lock-free dynamic font installation, and Linux font-match cache prewarming.

### Platform Backends, Web & Footprint

- **Apple platform sharing (v1.24.2, v1.25.2):** Built on the `gpui_apple` extraction by sharing the GCD dispatcher, Metal renderer, CoreText, Keychain, and thermal services between macOS and iOS.
- **macOS and Windows polish (v1.18.0–v1.25.2):** Completed objc2 migrations for window prompts, external drag-and-drop, screen capture, and URL schemes; fixed blurred window backgrounds on macOS 27 (v1.25.2); moved Windows dialogs and credential I/O off the foreground thread (v1.21.0); and fixed reversed linear/sRGB shader transfer functions on Windows (v1.22.0).
- **Web runtime and mobile input (v1.18.0–v1.25.2):** Added Android Gboard support, preserved iOS keyboard edits, drove IME mirror focus state from GPUI, disabled native browser canvas selection and touch callouts, added custom app font loading and Canvas font fallbacks, and avoided blocking Fetch response-body sends.
- **Binary size and licensing (v1.19.2–v1.25.2):** Relicensed `zlog`, `ztracing`, and `ztracing_macro` under Apache-2.0, removed `ztracing` from GPUI, upgraded wgpu to fix Vulkan surface teardown, and reduced upstream release binary sizes by 33% on macOS, 28% on Windows, and 7% on Linux.

## Crates.io Packaging & Distributions

With new performance and modular forks landing in September and October, developers have several distinct crates.io distribution options depending on their architectural needs.

<!-- Raw HTML so each <td> can carry a data-label: on narrow screens the table
     stacks into cards with the column name above each cell. -->
<table>
  <thead>
    <tr>
      <th scope="col">Distribution / Family</th>
      <th scope="col">Crates.io Packages</th>
      <th scope="col">Lineage &amp; Architecture</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Distribution / Family"><strong>GPUI Unofficial Mirror</strong></td>
      <td data-label="Crates.io Packages"><a href="https://crates.io/crates/gpui-unofficial"><code>gpui-unofficial</code></a><br /><a href="https://crates.io/crates/gpui-platform-gpui-unofficial"><code>gpui-platform-gpui-unofficial</code></a><br /><a href="https://crates.io/crates/scheduler-gpui-unofficial"><code>scheduler-gpui-unofficial</code></a></td>
      <td data-label="Lineage &amp; Architecture"><strong>Automated upstream mirror.</strong> Now under <a href="https://github.com/gpui-archipelago">gpui-archipelago</a>. Checks Zed every six hours and publishes the full crate family with verbatim Zed version tags (1.25.2).</td>
    </tr>
    <tr>
      <td data-label="Distribution / Family"><strong>GPUI Kit &amp; <code>gpui-pre</code></strong></td>
      <td data-label="Crates.io Packages"><a href="https://crates.io/crates/gpui-pre"><code>gpui-pre</code></a><br /><a href="https://crates.io/crates/gpui-kit"><code>gpui-kit</code></a><br /><a href="https://crates.io/crates/gpui-base"><code>gpui-base</code></a><br /><a href="https://crates.io/crates/gpui-component"><code>gpui-component</code></a><br /><a href="https://crates.io/crates/gpui-shell"><code>gpui-shell</code></a></td>
      <td data-label="Lineage &amp; Architecture"><strong>Weekly snapshot and full-stack facade.</strong> Longbridge’s republished upstream snapshots (0.3.x), fronted by the <code>gpui-kit</code> facade over unstyled infra (<code>gpui-base</code>), widgets (<code>gpui-component</code>), and scripting (<code>gpui-shell</code>).</td>
    </tr>
    <tr>
      <td data-label="Distribution / Family"><strong>gpui-fast</strong></td>
      <td data-label="Crates.io Packages"><a href="https://crates.io/crates/gpui-fast"><code>gpui-fast</code></a><br /><a href="https://crates.io/crates/gpui-fast-platform"><code>gpui-fast-platform</code></a></td>
      <td data-label="Lineage &amp; Architecture"><strong>Incremental rendering fork.</strong> Longbridge’s drop-in performance fork (0.1.x) retaining layout and paint work across frames, plus scroll layers and native WebView composition.</td>
    </tr>
    <tr>
      <td data-label="Distribution / Family"><strong>bite-gpui</strong></td>
      <td data-label="Crates.io Packages"><a href="https://crates.io/crates/bite-gpui"><code>bite-gpui</code></a><br /><a href="https://crates.io/crates/bite-gp-runtime"><code>bite-gp-runtime</code></a><br /><a href="https://crates.io/crates/bite-gp-engine"><code>bite-gp-engine</code></a><br /><a href="https://crates.io/crates/bite-gp-parley"><code>bite-gp-parley</code></a></td>
      <td data-label="Lineage &amp; Architecture"><strong>Modular five-layer architecture.</strong> Splits GPUI into decoupled layers (tracking 1.21.x–1.25.x) with pluggable text engines (<code>gpui_parley</code>) and layout systems (<code>gpui_morphorm</code>).</td>
    </tr>
  </tbody>
</table>

## Incremental Rendering & Modular Forks

### Retained Frame Rendering: Zed’s ViewTree vs. `gpui-fast`

Two parallel efforts set out to eliminate the CPU cost of re-evaluating unchanged views on every frame.

- **Zed’s persistent ViewTree ([#63800](https://github.com/zed-industries/zed/pull/63800)):** Mikayla Maki’s upstream refactor introduces a persistent `SlotMap<ViewNodeId, ViewNode>` that retains each view’s `LayoutId`, dependency read-sets, and per-phase paint outputs, replaying clean nodes from the previous frame’s paint lanes. Its benchmark harnesses and headless Linux WGPU backend merged to main; the ViewTree branch, which adds a `Component` trait and seals `View`, remains in draft.
- **Longbridge’s `gpui-fast`:** Authored primarily by `sunli829` and published to crates.io, `gpui-fast` makes zero public API changes. It reconstructs the immediate-mode element tree each frame but retains frame work — layout nodes, paint ranges, hitboxes, listeners, and primitives — when a view’s read entities, globals, and `ScrollHandle`/`ListState` versions are unchanged.

**Buffer splicing and fallbacks.** When a child view mutates inside a clean parent, `fast/splice.rs` splices the updated child output into the cached primitive stream, falling back to a full rebuild whenever splicing invariants are not met. Retention automatically disables during `window.refresh()`, resize, focus changes, dragging, inspector picking, and accessibility passes.

**Benchmarks and verification.** The fork is validated by a dual-window random-history oracle and a frame-by-frame headless verifier. In headless 60-panel benchmarks (retention on versus off in the same build), frame times dropped from 3.31 ms → 0.19 ms with no panels notified, 6.72 ms → 0.71 ms with one panel notified, and 10.33 ms → 7.38 ms when all 60 were notified, alongside major CPU reductions in scrolling and streaming benchmarks against `gpui-pre` 0.3.7. For the longer comparison, see [The Retained Frame](/news/the-retained-frame/).

### `bite-gpui` and `gpui_parley`

[`bite-gpui`](https://github.com/bite-gpui/bite-gpui) restructures GPUI into five standalone crates behind a drop-in facade so applications can swap internal subsystems without forking the engine.

- **Five-layer split:** Separates `gpui_types` (zero-dependency geometry), `gpui_platform` (OS bindings), `gpui_engine` (Scene IR and renderer traits), `gpui_runtime` (event dispatch and `FramePipeline` decorators), and `gpui_authoring` (reactive stores and `div()` builders).
- **Swappable text and layout:** Supports dropping in `gpui_parley` for BiDi text layout, complex script shaping, and font fallback, or `gpui_morphorm` as an alternative layout engine.
- **Text pipeline benchmarks:** `gpui_parley` introduces a deterministic raster size lattice (3.3 ms → 41.1 µs per frame, 80× faster by preventing glyph-atlas thrashing), a `(face, size)` glyph hinting cache (3,480 → 30 hinting runs per frame), and pre-tessellated vector glyph outlines (26.7 ms → 0.69 ms per screenful of text).

## GPU Interop & Surface Extensions

Embedding external 3D renderers, video streams, and native platform webviews directly into GPUI windows advanced through new crates and fork backports.

- **[`gpui_interop`](https://crates.io/crates/gpui-interop) (v0.2.0):** Built against the `bite-gpui` 1.25 line, this experimental crate enables zero-copy external GPU surface compositing inside `gpu_canvas`.
  - **Linux (Vulkan dma-buf):** Exports Vulkan images as dma-buf handles with DRM format modifiers and `sync_file` fences for `GpuCanvasContext::paint_surface`.
  - **Windows (D3D12 → D3D11):** Opens Direct3D 12 shared textures directly on GPUI’s Direct3D 11 device, synchronized across queues by a shared fence.
  - **WGPU and headless guest mode:** Supports same-device `WgpuSurface` fast-path rendering via `paint_texture`, plus a guest mode that runs headless GPUI on a worker thread for external host loops and game engines. macOS IOSurface → `MTLTexture` wrapping is planned but not yet implemented.
- **Native window composition (`gpui-fast` / [`zed#62379`](https://github.com/zed-industries/zed/pull/62379)):** `gpui-fast` ships cross-platform window composition for embedding native platform views — WKWebView on macOS, WebView2 on Windows, and WebKitGTK via X11 child windows or Wayland subsurfaces on Linux — while keeping GPUI popovers, menus, dialogs, and shadows composited on top.
