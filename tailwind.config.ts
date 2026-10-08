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
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        }
      }
    }
  },
  plugins: [],
}
export default config
