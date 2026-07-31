import type { NextConfig } from "next";

/**
 * Keep this config lean for `next dev` (Turbopack).
 * Worker size is controlled via wrangler `minify` + `next build --webpack`.
 *
 * Do NOT migrate middleware.ts → proxy.ts yet: OpenNext 1.20 treats proxy
 * as Node middleware and fails with "Node.js middleware is not currently supported."
 */
const nextConfig: NextConfig = {
  turbopack: {},
};

export default nextConfig;

// Bindings for local `next dev` only — avoid workerd during production/CI builds.
if (process.env.NODE_ENV === "development") {
  void import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
