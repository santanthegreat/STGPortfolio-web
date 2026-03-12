/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Archivo"', 'sans-serif'],
      },
      colors: {
        cream: '#f0ede6',
        gold: '#ffe135',
        'gold-dim': 'rgba(255,210,0,0.12)',
        'gold-border': 'rgba(255,210,0,0.4)',
      },
      keyframes: {
        gr: {
          '0%':   { backgroundPosition: '0 0' },
          '25%':  { backgroundPosition: '-8% -12%' },
          '50%':  { backgroundPosition: '12% 8%' },
          '75%':  { backgroundPosition: '-5% 15%' },
        },
        glow: {
          '0%,100%': { filter: 'drop-shadow(0 0 6px rgba(255,32,16,.35))' },
          '50%':     { filter: 'drop-shadow(0 0 15px rgba(255,32,16,.62))' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(110%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        gr:       'gr .35s steps(1) infinite',
        glow:     'glow 3s ease-in-out infinite',
        fadeIn:   'fadeIn .2s ease',
        slideUp:  'slideUp .48s cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
}





