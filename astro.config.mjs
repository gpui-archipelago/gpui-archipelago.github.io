// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Astro's HTML compressor strips the newline that separates a text node from
  // the inline element that follows it, which glues words together wherever the
  // two sit on different source lines ("rename in<code>Cargo.toml</code>"
  // renders as "rename inCargo.toml"). That whitespace is significant HTML, so
  // the compressor stays off and the markup is left as written.
  compressHTML: false,
  vite: {
    plugins: [tailwindcss()],
  },
});
