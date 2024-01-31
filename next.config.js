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
  output: 'standalone',
  basePath: process.env.NEXT_PUBLIC_PREFIX || "",
  images: {
    path: `${process.env.NEXT_PUBLIC_PREFIX || ""}/_next/image`,
    domains: process.env.NEXT_PUBLIC_DOMAINS ? process.env.NEXT_PUBLIC_DOMAINS.split(",") : undefined,
  },
  async headers() {
    return [
        {
            // matching all API routes
            source: "/api/:path*",
            headers: [
                { key: "Access-Control-Allow-Credentials", value: "true" },
                { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
                { key: "Access-Control-Allow-Methods", value: "GET,POST" },
                { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
            ]
        }
    ]
}
}
