import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Run PDF parsing libraries natively from node_modules (not bundled) so that
  // pdfjs-dist's worker file can be resolved correctly at runtime.
  serverExternalPackages: ["pdfjs-dist", "pdf-parse", "canvas"],
};

export default nextConfig;
