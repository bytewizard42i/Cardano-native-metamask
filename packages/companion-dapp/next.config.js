/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cmm/dapp-sdk', '@cmm/shared'],
};

module.exports = nextConfig;
