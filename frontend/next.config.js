/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, options) {
    config.experiments = { ...config.experiments, topLevelAwait: true }
    return config
  },
  reactStrictMode: true,
}

module.exports = nextConfig
