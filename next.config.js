/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:5173', 'localhost:5174', 'localhost:5175'],
    },
  },
};

export default nextConfig;
