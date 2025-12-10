import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
    // Formatos modernos con mejor compresión
    formats: ['image/avif', 'image/webp'],

    // Tamaños de dispositivos optimizados
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],

    // Tamaños de imágenes para íconos y miniaturas
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache de 1 año para imágenes optimizadas
    minimumCacheTTL: 31536000,

    // Deshabilitar optimización estática (mejor para dynamic imports)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
