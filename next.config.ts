import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
