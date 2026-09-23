import re

with open('app/globals.css', 'r') as f:
    content = f.read()

# Build a clean, elegant :root block — Uber/Apple inspired
root_css = '''
:root {
  color-scheme: dark;
  /* TOVEDROP — Classic & Clean (Uber/Apple Inspired) */
  --bg-deep: #000000;
  --surface-card: #0A0A0A;
  --surface-elevated: #141414;
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-muted: #666666;
  
  --brand-primary: #FFFFFF;
  
  --status-success: #34C759;
  --status-warning: #FF9F0A;
  --status-danger: #FF3B30;
  --status-neutral: #636366;
  --status-info: #007AFF;

  --green-brand: #34C759;
  --green-light: #30D158;
  --green-dark: #248A3D;
  --purple-brand: #007AFF;
  --purple-light: #5AC8FA;
  --orange-brand: #FFFFFF;
  --orange-dark: #E5E5E5;

  --background: var(--bg-deep);
  --foreground: var(--text-primary);
  --card: var(--surface-card);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-card);
  --popover-foreground: var(--text-primary);
  --primary: var(--brand-primary);
  --primary-foreground: #000000;
  --secondary: var(--surface-elevated);
  --secondary-foreground: var(--text-primary);
  --muted: var(--surface-elevated);
  --muted-foreground: var(--text-muted);
  --accent: #007AFF;
  --accent-foreground: #FFFFFF;
  --destructive: var(--status-danger);
  --border: var(--border-default);
  --input: var(--border-subtle);
  --ring: var(--brand-primary);
  --radius: 0.75rem;
  
  --sidebar: var(--surface-card);
  --sidebar-foreground: var(--text-primary);
  --sidebar-primary: var(--brand-primary);
  --sidebar-primary-foreground: #000000;
  --sidebar-accent: var(--surface-elevated);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border: var(--border-default);
  --sidebar-ring: var(--brand-primary);
}
'''

dark_css = '''
.dark {
  color-scheme: dark;
  /* TOVEDROP — Classic & Clean (Uber/Apple Inspired) */
  --bg-deep: #000000;
  --surface-card: #0A0A0A;
  --surface-elevated: #141414;
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-muted: #666666;
  
  --brand-primary: #FFFFFF;
  
  --status-success: #34C759;
  --status-warning: #FF9F0A;
  --status-danger: #FF3B30;
  --status-neutral: #636366;
  --status-info: #007AFF;

  --green-brand: #34C759;
  --green-light: #30D158;
  --green-dark: #248A3D;
  --purple-brand: #007AFF;
  --purple-light: #5AC8FA;
  --orange-brand: #FFFFFF;
  --orange-dark: #E5E5E5;

  --background: var(--bg-deep);
  --foreground: var(--text-primary);
  --card: var(--surface-card);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-card);
  --popover-foreground: var(--text-primary);
  --primary: var(--brand-primary);
  --primary-foreground: #000000;
  --secondary: var(--surface-elevated);
  --secondary-foreground: var(--text-primary);
  --muted: var(--surface-elevated);
  --muted-foreground: var(--text-muted);
  --accent: #007AFF;
  --accent-foreground: #FFFFFF;
  --destructive: var(--status-danger);
  --border: var(--border-default);
  --input: var(--border-subtle);
  --ring: var(--brand-primary);
  --radius: 0.75rem;
  
  --sidebar: var(--surface-card);
  --sidebar-foreground: var(--text-primary);
  --sidebar-primary: var(--brand-primary);
  --sidebar-primary-foreground: #000000;
  --sidebar-accent: var(--surface-elevated);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border: var(--border-default);
  --sidebar-ring: var(--brand-primary);
}
'''

content = re.sub(r':root\s*\{.*?\}(?=\s*\.dark\s*\{)', root_css, content, flags=re.DOTALL)
content = re.sub(r'\.dark\s*\{.*?\}(?=\s*@layer)', dark_css, content, flags=re.DOTALL)

with open('app/globals.css', 'w') as f:
    f.write(content)

print('Done!')
