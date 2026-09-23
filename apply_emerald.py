with open('app/globals.css', 'r') as f:
    content = f.read()

# -- :root replacements --
content = content.replace('--bg-deep: #212121;', '--bg-deep: #090D16;', 1)
content = content.replace('--surface-card: #2C2C2C;', '--surface-card: #0F172A;', 1)
content = content.replace('--surface-elevated: #363636;', '--surface-elevated: #1E293B;', 1)
content = content.replace('--border-subtle: rgba(255,255,255,0.08);', '--border-subtle: rgba(255,255,255,0.07);', 1)
content = content.replace('--border-default: rgba(255,255,255,0.12);', '--border-default: #334155;', 1)
content = content.replace('--text-primary: #FFFFFF;', '--text-primary: #F8FAFC;', 1)
content = content.replace('--text-secondary: #A1A1AA;', '--text-secondary: #94A3B8;', 1)
content = content.replace('--text-muted: #6B6B76;', '--text-muted: #64748B;', 1)
content = content.replace('--brand-primary: #FF7300;', '--brand-primary: #10B981;', 1)
content = content.replace('--status-warning: #FF7300;', '--status-warning: #F59E0B;', 1)
content = content.replace('--status-info: #8B5CF6;', '--status-info: #38BDF8;', 1)
content = content.replace('--status-neutral: #6B6B76;', '--status-neutral: #64748B;', 1)
content = content.replace('--purple-brand: #8B5CF6;', '--purple-brand: #38BDF8;', 1)
content = content.replace('--purple-light: #A78BFA;', '--purple-light: #7DD3FC;', 1)
content = content.replace('--orange-brand: #FF7300;', '--orange-brand: #10B981;', 1)
content = content.replace('--orange-dark: #E65C00;', '--orange-dark: #059669;', 1)
content = content.replace('--accent: var(--purple-brand);', '--accent: #38BDF8;', 1)
content = content.replace('--sidebar-primary: #FF7300;', '--sidebar-primary: #10B981;', 1)

# -- .dark replacements (second occurrences) --
content = content.replace('--bg-deep: #212121;', '--bg-deep: #090D16;', 1)
content = content.replace('--surface-card: #2C2C2C;', '--surface-card: #0F172A;', 1)
content = content.replace('--surface-elevated: #363636;', '--surface-elevated: #1E293B;', 1)
content = content.replace('--border-subtle: rgba(255,255,255,0.08);', '--border-subtle: rgba(255,255,255,0.07);', 1)
content = content.replace('--border-default: rgba(255,255,255,0.12);', '--border-default: #334155;', 1)
content = content.replace('--text-primary: #FFFFFF;', '--text-primary: #F8FAFC;', 1)
content = content.replace('--text-secondary: #A1A1AA;', '--text-secondary: #94A3B8;', 1)
content = content.replace('--text-muted: #6B6B76;', '--text-muted: #64748B;', 1)
content = content.replace('--brand-primary: #FF7300;', '--brand-primary: #10B981;', 1)
content = content.replace('--status-warning: #FF7300;', '--status-warning: #F59E0B;', 1)
content = content.replace('--status-info: #8B5CF6;', '--status-info: #38BDF8;', 1)
content = content.replace('--status-neutral: #6B6B76;', '--status-neutral: #64748B;', 1)
content = content.replace('--purple-brand: #8B5CF6;', '--purple-brand: #38BDF8;', 1)
content = content.replace('--purple-light: #A78BFA;', '--purple-light: #7DD3FC;', 1)
content = content.replace('--orange-brand: #FF7300;', '--orange-brand: #10B981;', 1)
content = content.replace('--orange-dark: #E65C00;', '--orange-dark: #059669;', 1)
content = content.replace('--accent: var(--purple-brand);', '--accent: #38BDF8;', 1)
content = content.replace('--sidebar-primary: #FF7300;', '--sidebar-primary: #10B981;', 1)

# Update the comment labels
content = content.replace('/* TOVEDROP Day 1 Palette */', '/* TOVEDROP Obsidian Slate & Electric Emerald */')

with open('app/globals.css', 'w') as f:
    f.write(content)

print('Done!')
