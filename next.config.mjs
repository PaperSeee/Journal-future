/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb", // allow base64 screenshots
    },
  },
};

export default nextConfig;
