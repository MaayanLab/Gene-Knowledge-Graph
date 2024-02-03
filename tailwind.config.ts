import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'cfde-dark-blue': '#336699',
        'cfde-light-blue': '#c3e1e6',
        'cfde-purple': '6c3a77',
        'cfde-grey': '#4c4d50'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
