function rgb(name) {
  return `rgb(var(${name}) / <alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '700px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          50: rgb('--c-ink-50'),
          100: rgb('--c-ink-100'),
          200: rgb('--c-ink-200'),
          300: rgb('--c-ink-300'),
          400: rgb('--c-ink-400'),
          500: rgb('--c-ink-500'),
          600: rgb('--c-ink-600'),
          700: rgb('--c-ink-700'),
          800: rgb('--c-ink-800'),
          900: rgb('--c-ink-900'),
          950: rgb('--c-ink-950'),
        },
        surface: rgb('--c-surface'),
        accent: {
          DEFAULT: rgb('--c-accent'),
          soft: rgb('--c-accent-soft'),
          hover: rgb('--c-accent-hover'),
        },
        pass: {
          DEFAULT: rgb('--c-pass'),
          soft: rgb('--c-pass-soft'),
        },
        fail: {
          DEFAULT: rgb('--c-fail'),
          soft: rgb('--c-fail-soft'),
        },
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
};
