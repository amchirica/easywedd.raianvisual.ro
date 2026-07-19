import type { NextConfig } from "next";

/**
 * Keep this config lean for `next dev` (Turbopack).
 * Heavy webpack aliases / experimental flags caused noisy or fatal
 * Turbopack warnings; Worker size is controlled via wrangler `minify`
 * and `next build --webpack` in package.json scripts.
 */
const nextConfig: NextConfig = {
  // Acknowledges Turbopack (Next 16 default) so future webpack plugins
  // from OpenNext do not fail `next dev`.
  turbopack: {},
};

export default nextConfig;

// OpenNext Cloudflare local bindings (no-op impact on plain `next build`)
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
