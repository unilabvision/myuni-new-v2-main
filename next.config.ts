import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['iyzipay'],
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // react-pdf (pdfjs-dist) canvas paketini isteğe bağlı arar, ancak tarayıcıda bulunmadığı için Next.js derlemesi hata verir.
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        os: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    // Vercel Image Optimization kotası dolduğunda /_next/image kırılıyor.
    // Supabase/Clerk görselleri doğrudan kaynak URL'den yüklenir (koleksiyon/dergi fix'i site geneli).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'emfvwpztyuykqtepnsfp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'emfvwpztyuykqtepnsfp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'myunilab.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.myunilab.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/robots.txt',
        destination: '/api/robots.txt',
      },
      {
        source: '/course-preview/cmcaldohq3boy08mp05g80e0j',
        destination: '/tr/kurs/crispr-cas9-teknolojisi-genomik-duzenleme-egitimi',
      },
    ];
  },
};

export default nextConfig;