import re

with open('app/globals.css', 'r') as f:
    content = f.read()

root_css = '''
:root {
  color-scheme: dark;
  /* TOVEDROP Day 1 Palette */
  --bg-deep: #0A0A0F;
  --surface-card: #131318;
  --surface-elevated: #1A1A21;
  --border-subtle: rgba(255,255,255,0.08);
  --border-default: rgba(255,255,255,0.12);
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-muted: #6B6B76;
  
  --brand-primary: #8B5CF6;
  
  --status-success: #22C55E;
  --status-warning: #F97316;
  --status-danger: #EF4444;
  --status-neutral: #6B6B76;
  --status-info: #8B5CF6;

  --green-brand: #22C55E;
  --green-light: #4ADE80;
  --green-dark: #16A34A;
  --purple-brand: #8B5CF6;
  --purple-light: #A78BFA;
  --orange-brand: #F97316;
  --orange-dark: #EA6C0A;

  --background: var(--bg-deep);
  --foreground: var(--text-primary);
  --card: var(--surface-card);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-card);
  --popover-foreground: var(--text-primary);
  --primary: var(--brand-primary);
  --primary-foreground: #FFFFFF;
  --secondary: var(--surface-elevated);
  --secondary-foreground: var(--text-primary);
  --muted: var(--surface-elevated);
  --muted-foreground: var(--text-muted);
  --accent: var(--orange-brand);
  --accent-foreground: #FFFFFF;
  --destructive: var(--status-danger);
  --border: var(--border-default);
  --input: var(--border-subtle);
  --ring: var(--brand-primary);
  --radius: 0.75rem;
  
  --sidebar: var(--surface-card);
  --sidebar-foreground: var(--text-primary);
  --sidebar-primary: var(--brand-primary);
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: var(--border-subtle);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border: var(--border-default);
  --sidebar-ring: var(--brand-primary);
}
'''

content = re.sub(r':root\s*\{.*?\}(?=\s*\.dark\s*\{|\s*@layer)', root_css, content, flags=re.DOTALL)
# The current globals.css might still have .dark. We will just remove it to match Day 1, or replace it with the same root_css but named .dark
dark_css = root_css.replace(':root {', '.dark {')
content = re.sub(r'\.dark\s*\{.*?\}(?=\s*@layer)', dark_css, content, flags=re.DOTALL)

with open('app/globals.css', 'w') as f:
    f.write(content)
