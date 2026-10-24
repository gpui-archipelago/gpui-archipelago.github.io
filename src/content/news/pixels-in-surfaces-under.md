---
title: "Pixels In, Surfaces Under: gpui_interop vs. gpui-fast"
date: 2026-10-24
description: "Two ways to put foreign pixels in a GPUI window: gpui_interop's zero-copy GPU texture bridge and gpui-fast's native OS surface composition."
tags: ["showcase"]
---

<figure class="m-0 mb-8">
  <picture>
    <source media="(max-width: 40rem)" srcset="/images/pixels-in-surfaces-under-mobile.svg" />
    <img
      src="/images/pixels-in-surfaces-under.svg"
      width="920"
      height="440"
      alt="Two-panel diagram comparing gpui_interop (an external GPU texture sampled inside GPUI's scene) with gpui-fast native composition (native OS surfaces stacked by the compositor)."
      style="display:block; width:100%; height:auto;"
    />
  </picture>
  <figcaption class="mt-3 text-small text-content-muted">Left: <code>gpui_interop</code> imports an external producer’s GPU image as a sampled texture inside GPUI’s scene. Right: <code>gpui-fast</code> stacks native OS surfaces and leaves compositing to the window compositor.</figcaption>
</figure>

Sooner or later, you want to draw something inside a GPUI window that GPUI didn’t render itself. A 3D viewport for a game editor, a 1080p video timeline, or a WebView.

Upstream GPUI gives you `image()`, which copies pixels from CPU memory to the GPU. That works fine for static images, and it even works for video editors like OpenCut — until you check the profiler. Copying a 1080p video frame through system RAM burns roughly 4–8 ms every frame. At 60 fps, that’s up to half your frame budget gone just moving bytes around.

Right now, there are two ways in the ecosystem to put foreign content inside GPUI without that CPU copy: the new **[`gpui_interop`](https://crates.io/crates/gpui-interop)** crate (part of the [`bite-gpui`](https://github.com/bite-gpui/bite-gpui) modularity effort), and **[`gpui-fast`](https://github.com/longbridge/gpui-fast)**’s native composition (used in [`gpui-kit`](https://crates.io/crates/gpui-kit) to run embedded WebViews).

They sound similar on paper, but they do completely different jobs. One brings external pixels *into* GPUI’s scene as a texture; the other puts a native OS window *underneath* GPUI. They don’t compete — they solve two different problems.

## What gpui_interop does

`gpui_interop` is a zero-copy GPU texture bridge. An external renderer — Vulkan, `wgpu`, Bevy, Pulsar’s Helio renderer, or a hardware video decoder — draws into a shareable GPU image on its own device, exports an OS handle, and hands it to GPUI. GPUI imports the handle and draws it through upstream’s `surface()` element.

```text
Vulkan / wgpu / Bevy / Helio / video decoder
  → exportable GPU image
  → dma-buf (Linux) or shared D3D texture (Windows) + fence
  → GPUI imports and samples it via paint_surface
  → GPUI draws it inside its normal scene
```

Because the external frame is just a texture inside GPUI’s renderer, GPUI is still in charge of compositing. You get full alpha transparency (once your external renderer clears its alpha channel properly, as demonstrated in the `helio-interop` branch). GPUI can draw background tiles behind the 3D scene and normal GPUI buttons right on top of it.

**Same-device shortcut:** If your external renderer uses `wgpu` on the same GPU device as GPUI’s `wgpu` backend, you don’t even need OS handles. `Adapter::wgpu` gives you GPUI’s own device and queue. You render into a `WgpuSurface`, and GPUI draws it directly with `paint_texture` — no export, no import, no fences.

**Performance so far:** The `dma-buf` handoff itself is free. On a 10-year-old laptop, simple 3D scenes render in under 4 ms. Raw Vulkan takes ~0.5 ms on a discrete GPU, and both Bevy and Helio hit 59–60 fps in release builds.

**Shortcomings:**

- **It’s just pixels and basic input.** `gpui_interop` has a `surface_input` helper to map mouse and keyboard events into the viewport, but it isn’t a window manager. If you tried to render a WebView this way, you’d have to wire up scrolling, text selection, IME popups, and accessibility yourself.
- **Still experimental.** Linux (`dma-buf` + `sync_file` fences) and Windows (DX12 shared textures into GPUI’s DX11 device) work across the repo’s 5 demos, but macOS (`IOSurface` → `MTLTexture`) isn’t built yet.

## What gpui-fast does

`gpui-fast` doesn’t touch your GPU textures. Instead, it creates a native OS child window (or Wayland subsurface / macOS child view) for foreign content like a WebView, and places separate GPUI overlay surfaces on top of it.

```text
GPUI top-level window
├── GPUI overlay subsurface   ← GPUI menus and popovers
└── WebView native subsurface ← WebView owns its pixels and input
```

Here, GPUI never sees the WebView’s pixels. The WebView renders and presents to its own native surface, and the OS window compositor stitches the layers together.

**Shortcomings:**

- **GPUI can’t touch the pixels.** Because the OS compositor draws the child surface, GPUI can’t apply shaders to it or treat it like a normal element in the scene graph.
- **Layering requires extra OS surfaces.** You can’t just draw a GPUI button over a native subsurface in the normal paint pass. To keep a dropdown menu or modal from hiding behind the WebView, `gpui-fast` has to spin up a dedicated GPUI overlay surface above it.
- **X11 quirks.** It works well on macOS, Windows, and Wayland, but on X11, overlay behavior depends on whether the user’s window compositor supports it properly.

## Direct comparison

<!-- Raw HTML so each <td> can carry a data-label: on narrow screens the table
     stacks into cards with the column name above each cell. -->
<table>
  <thead>
    <tr>
      <th scope="col">Aspect</th>
      <th scope="col"><code>gpui_interop</code></th>
      <th scope="col"><code>gpui-fast</code> native composition</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Aspect"><strong>Transport</strong></td>
      <td data-label="gpui_interop"><code>dma-buf</code>, shared D3D texture, planned <code>IOSurface</code></td>
      <td data-label="gpui-fast">Native child window / view / subsurface</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>Producer</strong></td>
      <td data-label="gpui_interop">Vulkan, <code>wgpu</code>, Bevy, Helio, video decoders</td>
      <td data-label="gpui-fast">WebViews, native OS toolkits</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>Pixel ownership</strong></td>
      <td data-label="gpui_interop">GPUI imports and samples the producer’s texture</td>
      <td data-label="gpui-fast">Foreign stack owns and presents its own pixels</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>GPUI sees pixels?</strong></td>
      <td data-label="gpui_interop">Yes — as an imported GPU texture</td>
      <td data-label="gpui-fast">No</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>Who composites?</strong></td>
      <td data-label="gpui_interop">GPUI’s renderer</td>
      <td data-label="gpui-fast">OS window compositor</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>GPUI UI on top?</strong></td>
      <td data-label="gpui_interop">Natural: just draw elements over <code>surface()</code></td>
      <td data-label="gpui-fast">Requires a separate GPUI overlay surface</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>Synchronization</strong></td>
      <td data-label="gpui_interop">Explicit (<code>sync_file</code> fences, shared D3D fences, ring buffers)</td>
      <td data-label="gpui-fast">Handled by the OS surface / compositor</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>Input</strong></td>
      <td data-label="gpui_interop">Optional <code>surface_input</code> maps events to the viewport</td>
      <td data-label="gpui-fast">Native toolkit gets OS input directly</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>CPU copy</strong></td>
      <td data-label="gpui_interop">Avoided</td>
      <td data-label="gpui-fast">Avoided</td>
    </tr>
    <tr>
      <td data-label="Aspect"><strong>Platform status</strong></td>
      <td data-label="gpui_interop">Experimental: Linux and Windows working; macOS planned</td>
      <td data-label="gpui-fast">macOS, Windows, Wayland, and X11 supported</td>
    </tr>
  </tbody>
</table>

## How synchronization works

Because `gpui_interop` shares raw GPU buffers, it has to handle synchronization explicitly:

- **Linux:** The producer exports a `sync_file` fence alongside the `dma-buf`. GPUI waits on that fence before sampling the texture. If the producer renders every frame, it uses a ring of buffers and waits for `DmaBufHandle::release` before reusing a slot.
- **Windows:** A D3D12 producer exports a shared texture and a shared fence. GPUI’s D3D11 renderer opens the texture and synchronizes the two GPU queues.

`gpui-fast` leaves synchronization to the OS. The WebView submits frames to its own surface, and the platform compositor keeps that surface ordered beneath GPUI’s overlay.

## Which one to use

- **Use `gpui_interop`** when you have a GPU-rendered frame that belongs inside GPUI’s scene: a Bevy or Helio 3D viewport, a custom Vulkan renderer, a hardware-decoded video player, or 3D UI elements. You get zero-copy performance and can draw normal GPUI panels and controls directly over the viewport.
- **Use `gpui-fast` native composition** when you are embedding a full native widget stack — especially a WebView — where you want the OS to handle input, scrolling, accessibility, and rendering on its own.

You can also use both in the same app. A WebView can live in a native subsurface managed by the OS compositor, while a Bevy 3D viewport uses `gpui_interop` to stream frames straight into GPUI’s scene right next to it.

The short version: `gpui_interop` brings pixels *into* GPUI; `gpui-fast` keeps pixels *outside* GPUI and tucks a native surface underneath.

---

For the rendering architecture behind `gpui-fast`, see [The Retained Frame](/news/the-retained-frame/).
