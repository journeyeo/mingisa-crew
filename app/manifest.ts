import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "민기사 크루",
    short_name: "민기사크루",
    description: "인천공항 시간대별 입국 수요 · 기사용",
    start_url: "/airport",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#1B5E36",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
