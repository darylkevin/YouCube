import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 1. Proxy the API calls
        source: "/api/:path*",
        destination: "http://fastapi.prod-youcube.svc.cluster.local:80/api/:path*",
      },
      {
        // 2. Proxy the Swagger UI
        source: "/docs",
        destination: "http://fastapi.prod-youcube.svc.cluster.local:80/docs",
      },
      {
        // 3. Proxy the OpenAPI schema (Required for /docs to load)
        source: "/openapi.json",
        destination: "http://fastapi.prod-youcube.svc.cluster.local:80/openapi.json",
      },
    ];
  },
};

export default nextConfig;