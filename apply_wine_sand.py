import re

with open('app/globals.css', 'r') as f:
    content = f.read()

# Completely rebuild the :root and .dark sections to ensure perfection
root_pattern = r':root\s*\{.*?\}(?=\s*\.dark\s*\{|\s*@layer)'
dark_pattern = r'\.dark\s*\{.*?\}(?=\s*@layer)'

root_css = '''
:root {
  color-scheme: light;
  /* TOVEDROP Wine & Sand - LIGHT MODE */
  --bg-deep: #F5EBD0;
  --surface-card: #FCF4E2;
  --surface-elevated: #EDDFBB;
  --border-subtle: #D8CBAA;
  --border-default: #7F011F;
  --text-primary: #7F011F;
  --text-secondary: #A62940;
  --text-muted: #B85060;
  
  --brand-primary: #7F011F;
  
  --status-success: #10B981;
  --status-warning: #F59E0B;
  --status-danger: #EF4444;
  --status-info: #7F011F;
  --status-neutral: #D8CBAA;

  --green-brand: #7F011F;
  --green-light: #A62940;
  --green-dark: #5C0015;
  --purple-brand: #7F011F;
  --purple-light: #A62940;
  --orange-brand: #A62940;
  --orange-dark: #7F011F;

  --background: var(--bg-deep);
  --foreground: var(--text-primary);
  --card: var(--surface-card);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-card);
  --popover-foreground: var(--text-primary);
  --primary: var(--brand-primary);
  --primary-foreground: #F5EBD0;
  --secondary: var(--surface-elevated);
  --secondary-foreground: var(--text-primary);
  --muted: var(--surface-elevated);
  --muted-foreground: var(--text-muted);
  --accent: var(--surface-elevated);
  --accent-foreground: var(--text-primary);
  --destructive: var(--status-danger);
  --border: var(--border-default);
  --input: var(--border-default);
  --ring: var(--brand-primary);
  --radius: 0.5rem;
  
  --sidebar: var(--surface-card);
  --sidebar-foreground: var(--text-primary);
  --sidebar-primary: var(--brand-primary);
  --sidebar-primary-foreground: #F5EBD0;
  --sidebar-accent: var(--surface-elevated);
  --sidebar-accent-foreground: var(--text-primary);
  --sidebar-border: var(--border-default);
  --sidebar-ring: var(--brand-primary);
}
'''

dark_css = '''
.dark {
  color-scheme: dark;
  /* TOVEDROP Wine & Sand - DARK MODE */
  --bg-deep: #7F011F;
  --surface-card: #660018;
  --surface-elevated: #8C0A29;
  --border-subtle: #A62940;
  --border-default: #F5EBD0;
  --text-primary: #F5EBD0;
  --text-secondary: #EDDFBB;
  --text-muted: #D8CBAA;
  
  --brand-primary: #F5EBD0;
  
  --status-neutral: #A62940;
  --status-info: #F5EBD0;

  --green-brand: #F5EBD0;
  --green-light: #FCF4E2;
  --green-dark: #EDDFBB;
  --purple-brand: #F5EBD0;
  --purple-light: #FCF4E2;
  --orange-brand: #EDDFBB;
  --orange-dark: #F5EBD0;

  --background: var(--bg-deep);
  --foreground: var(--text-primary);
  --card: var(--surface-card);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-card);
  --popover-foreground: var(--text-primary);
  --primary: var(--brand-primary);
  --primary-foreground: #7F011F;
  --secondary: var(--surface-elevated);
  --secondary-foreground: var(--text-primary);
  --muted: var(--surface-elevated);
  --muted-foreground: var(--text-muted);
  --accent: var(--surface-elevated);
  --accent-foreground: var(--text-primary);
  --destructive: var(--status-danger);
  --border: var(--border-default);
  --input: var(--border-default);
  --ring: var(--brand-primary);
  
  --sidebar: var(--surface-card);
  --sidebar-foreground: var(--text-primary);
  --sidebar-primary: var(--brand-primary);
  --sidebar-primary-foreground: #7F011F;
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
