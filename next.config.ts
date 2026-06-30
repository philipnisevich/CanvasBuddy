import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the tracing root to this project so a stray lockfile in a parent
  // directory doesn't make Next infer the wrong workspace root.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
