import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EAF6FD',
          100: '#D3EDFA',
          200: '#A8DBF5',
          300: '#74C3ED',
          400: '#4AACE3',
          500: '#3B9DC8',  // primary
          600: '#2E82A8',
          700: '#226785',
          800: '#164B61',
          900: '#0A2F3D',
        },
        green: {
          400: '#7ECB6A',
          500: '#6DB878',  // success
          600: '#5AA066',
        },
        yellow: {
          400: '#F5C842',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E8F5FD',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(160deg, #EAF6FD 0%, #C8E8F5 100%)',
        'card-gradient': 'linear-gradient(135deg, #3B9DC8 0%, #2E82A8 100%)',
      },
      boxShadow: {
        card: '0 2px 12px rgba(59,157,200,0.10)',
        nav:  '0 -2px 16px rgba(0,0,0,0.07)',
      },
    },
  },
  plugins: [],
}
export default config
