/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 24px 80px rgba(15, 23, 42, 0.35)'
      },
      backdropBlur: {
        xs: '2px'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(168, 85, 247, 0)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.22)' }
        }
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        pulseGlow: 'pulseGlow 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
