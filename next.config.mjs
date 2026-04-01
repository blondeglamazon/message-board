import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ==========================================================
  // 📱 AUTOMATIC MOBILE CAPACITOR SETTINGS 
  // ==========================================================
  output: process.env.MOBILE_BUILD === 'true' ? 'export' : undefined, 

  images: {
    unoptimized: process.env.MOBILE_BUILD === 'true' ? true : undefined,
  },

  // ==========================================================
  // 🌐 CORS HEADERS FOR MOBILE API ACCESS
  // ==========================================================
  // Conditionally apply headers ONLY for the live web server build.
  // Next.js will crash if headers() exists during a static export!
  ...(process.env.MOBILE_BUILD !== 'true' && {
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          ],
        },
      ];
    },
  }),

  // ==========================================================
  // 🔒 SECURITY SETTINGS
  // ==========================================================
  productionBrowserSourceMaps: false,

  // ==========================================================
  // 🚀 PERFORMANCE & BUNDLE OPTIMIZATIONS
  // ==========================================================
  
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
        },
      };
    }
    return config;
  },
};

export default bundleAnalyzer(nextConfig);