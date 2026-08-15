import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    airport: {
      stale: 60,
      revalidate: 300,  // 5분마다 갱신 (개발계정 일 500 소진 방지)
      expire: 600,
    },
  },
};

export default nextConfig;
