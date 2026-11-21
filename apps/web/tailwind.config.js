/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'sm': '480px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1440px',
    },
    extend: {
      colors: {
        canvas: {
          light: '#E9ECF3',
          dark: '#060814',
        },
        ink: {
          primary: '#0B1020',
          secondary: '#4A5270',
          tertiary: '#7A829E',
          'dark-primary': '#F1F5F9',
          'dark-secondary': '#94A3B8',
          'dark-tertiary': '#64748B',
        },
        primaryAction: {
          start: '#FF5A3C',
          middle: '#E8301F',
          end: '#FF9A3C',
        },
        infoAction: {
          start: '#2F6BFF',
          middle: '#2AA8FF',
          end: '#5CE1FF',
        },
        audioAction: {
          start: '#7C4DFF',
          end: '#B36BFF',
        },
        success: '#2FCB8C',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
      borderRadius: {
        'squircle': '18px',
        'field': '28px',
        'card': '32px',
        'modal': '36px',
        'pill': '999px',
      },
      boxShadow: {
        'glow-primary': '0 10px 25px -4px rgba(232, 48, 31, 0.45)',
        'glow-info': '0 10px 25px -4px rgba(47, 107, 255, 0.45)',
        'glow-audio': '0 10px 25px -4px rgba(124, 77, 255, 0.45)',
      }
    },
  },
  plugins: [],
};

