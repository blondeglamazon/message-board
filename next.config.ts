import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'export',
  images: { unoptimized: true },
  skipProxyUrlNormalize: true,  // <--- Updated from skipMiddlewareUrlNormalize
};

export default nextConfig;