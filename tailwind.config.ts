import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': 'var(--bg-deep)',
        'surface-card': 'var(--surface-card)',
        'surface-elevated': 'var(--surface-elevated)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        // Green brand (primary accent)
        'green-brand': 'var(--green-brand)',
        'green-light': 'var(--green-light)',
        'green-dark': 'var(--green-dark)',
        // Backward-compat: purple-brand now resolves to green
        'purple-brand': 'var(--purple-brand)',
        'purple-light': 'var(--purple-light)',
        // Warm secondary
        'orange-brand': 'var(--orange-brand)',
        'orange-dark': 'var(--orange-dark)',
        'status-success': 'var(--status-success)',
        'status-warning': 'var(--status-warning)',
        'status-danger': 'var(--status-danger)',
        'status-neutral': 'var(--status-neutral)',
        'status-info': 'var(--status-info)',
      },
      animation: {
        'float-slow': 'float-slow 15s ease-in-out infinite',
        'float-delayed': 'float-slow 20s ease-in-out infinite -5s',
        'float-slower': 'float-slow 25s ease-in-out infinite -10s',
        'wave-slide': 'wave-slide 10s linear infinite',
        'wave-slide-slow': 'wave-slide 16s linear infinite',
        'curve-entrance': 'curve-entrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow': 'spin 80s linear infinite',
        'spin-reverse-slow': 'spin-reverse 100s linear infinite',
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'wave-slide': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'curve-entrance': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-reverse': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg)' },
        }
      }
    }
  },
  plugins: [],
}
export default config
