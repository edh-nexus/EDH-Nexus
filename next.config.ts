import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/EDH-Nexus" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/EDH-Nexus/" : undefined,
  trailingSlash: true,
};

export default nextConfig;
