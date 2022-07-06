module.exports = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 1500,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Important: return the modified config
    config.module.rules.push(
      {
        test: /\.(png|jpe?g|gif|gmt)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      }
    )
    return config
  },
  experimental: {
    outputStandalone: true,
  },
  basePath: process.env.NEXT_PUBLIC_PREFIX || "",
}
