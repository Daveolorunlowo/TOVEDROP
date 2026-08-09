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
        'purple-brand': 'var(--purple-brand)',
        'purple-light': 'var(--purple-light)',
        'orange-brand': 'var(--orange-brand)',
        'orange-dark': 'var(--orange-dark)',
        'status-success': 'var(--status-success)',
        'status-warning': 'var(--status-warning)',
        'status-danger': 'var(--status-danger)',
        'status-neutral': 'var(--status-neutral)',
        'status-info': 'var(--status-info)',
      }
    }
  },
  plugins: [],
}
export default config
