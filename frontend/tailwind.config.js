/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#050506',
          light: '#ffffff',
        },
        foreground: {
          DEFAULT: '#f4f4f5',
          light: '#0a0a0a',
        },
        primary: {
          DEFAULT: '#780606',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#111014',
          light: '#f5f5f5',
          foreground: {
            DEFAULT: '#d4d4d8',
            light: '#525252',
          },
        },
        accent: {
          DEFAULT: '#1b1b22',
          light: '#f0f0f0',
          foreground: {
            DEFAULT: '#f4f4f5',
            light: '#0a0a0a',
          },
        },
        success: '#22c55e',
        warning: '#facc15',
        muted: {
          DEFAULT: '#1a1a22',
          light: '#e5e5e5',
          foreground: {
            DEFAULT: '#8f8f9a',
            light: '#737373',
          },
        },
        border: {
          DEFAULT: '#1f1f25',
          light: '#e5e5e5',
        },
        input: {
          DEFAULT: '#1f1f25',
          light: '#f5f5f5',
        },
        ring: '#780606',
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      screens: {
        'xs': '320px', // Very small phones (iPhone SE, etc.)
        'sm': '640px', // Small phones and up
        'md': '768px', // Tablets and up
        'lg': '1024px', // Desktop and up
        'xl': '1280px', // Large desktop
        '2xl': '1536px', // Extra large desktop
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
}

