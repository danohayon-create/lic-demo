/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        paper: '#F6F5F1', // warm off-white global background
        card: '#FFFFFF',
        line: '#ECEAE4', // very light card border

        // Text
        ink: '#15140F', // primary, near-black
        muted: '#6E6A60', // secondary, warm grey

        // Premium / brand accents
        cream: '#F1E4C3', // premium CTA background (Snap apply, Self Tape)
        gold: '#F2C200', // vivid gold — match badges, lightning

        // Signal / rating system
        signal: {
          no: '#E0483D', // No go
          maybe: '#F4B400', // Maybe
          good: '#2BA36B', // Good match
          'good-bg': '#E7F6EE', // selected good-match background
        },

        // Match score + links
        match: '#16A34A',
        link: '#2563EB',

        // Brand mark squares
        brand: {
          yellow: '#F2C200',
          blue: '#2563EB',
          red: '#E0483D',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '18px',
        btn: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,20,15,0.04), 0 6px 20px rgba(21,20,15,0.05)',
        'card-hover': '0 2px 4px rgba(21,20,15,0.06), 0 12px 32px rgba(21,20,15,0.09)',
        phone: '0 30px 80px rgba(21,20,15,0.22), 0 8px 24px rgba(21,20,15,0.12)',
      },
      letterSpacing: {
        label: '0.12em', // uppercase technical labels
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.12em' }],
      },
    },
  },
  plugins: [],
}
