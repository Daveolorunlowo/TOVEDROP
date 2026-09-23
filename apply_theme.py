import re

with open('app/globals.css', 'r') as f:
    content = f.read()

# We'll replace the :root block up to the Shadcn Baseline
# Actually, it's safer to just replace specific lines.

replacements = {
    '--bg-deep: #4A221C;': '--bg-deep: #111111;',
    '--surface-card: #5C2D26;': '--surface-card: #1A1A1A;',
    '--surface-elevated: #6E3830;': '--surface-elevated: #242424;',
    '--border-subtle: #82453B;': '--border-subtle: #3F1346;',
    '--border-default: #82453B;': '--border-default: #3F1346;',
    '--text-primary: #FAFAFA;': '--text-primary: #E7D6F2;',
    '--text-secondary: #A1A1AA;': '--text-secondary: #C8B6D3;',
    '--text-muted: #71717A;': '--text-muted: #9F8CA9;',
    '--brand-primary: #7C3AED;': '--brand-primary: #3F1346;',
    '--purple-brand: var(--brand-primary);': '--purple-brand: #3F1346;',
    '--orange-brand: #F59E0B;': '--orange-brand: #E7D6F2;',
    '--orange-dark: #D97706;': '--orange-dark: #CBAFD9;'
}

for old, new_val in replacements.items():
    content = content.replace(old, new_val)

with open('app/globals.css', 'w') as f:
    f.write(content)
