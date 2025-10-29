import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "a-ipower.com",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
