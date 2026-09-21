/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clinical Brand Tokens
        clinical: {
          50: '#F0FDFA',   // Lightest teal tint
          100: '#CCFBF1',
          200: '#99F6E4',  // Teal borders
          500: '#14B8A6',
          600: '#0D9488',  // Primary Clinical CTA
          700: '#0F766E',  // Primary Hover
          800: '#115E59',
          900: '#134E4A',  // Deep Teal Text
        },
        // Semantic Healthcare Status Colors
        urgency: {
          routine: '#475569',   // Slate-600
          urgent: '#B45309',    // Amber-700
          emergency: '#BE123C', // Rose-700
        },
        confidence: {
          high: '#047857',      // Emerald-700 (Verified)
          review: '#B45309',    // Amber-700 (Needs Review)
          rejected: '#64748B',  // Slate-500 (Rejected)
        },
        sync: {
          online: '#059669',    // Emerald-600
          offline: '#D97706',   // Amber-600
          syncing: '#0284C7',   // Sky-600
          failed: '#E11D48',    // Rose-600
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
