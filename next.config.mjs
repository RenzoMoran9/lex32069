/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse usa APIs de Node y no debe empaquetarse por webpack.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
    // Asegura que los PDFs de /docs y la caché extraída se incluyan en
    // las funciones serverless de Vercel (file tracing).
    outputFileTracingIncludes: {
      "/api/**": ["./docs/**", "./.context-cache/**"],
    },
  },
};

export default nextConfig;
