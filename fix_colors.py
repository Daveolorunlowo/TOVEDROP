with open('app/globals.css', 'r') as f:
    content = f.read()

replacements = {
    '--bg-deep: #F1F5F9;': '--bg-deep: #09090B;',
    '--surface-card: #F8FAFC;': '--surface-card: #111116;',
    '--surface-elevated: #E2E8F0;': '--surface-elevated: #1F1F2E;',
    '--border-subtle: #E4E4E7;': '--border-subtle: #27273A;',
    '--border-default: #D4D4D8;': '--border-default: #27273A;',
    '--text-primary: #09090B; /* Dark charcoal */': '--text-primary: #FAFAFA;',
    '--text-secondary: #3F3F46;': '--text-secondary: #A1A1AA;'
}

for old, new_val in replacements.items():
    content = content.replace(old, new_val)

content = content.replace('color-scheme: light;', 'color-scheme: dark;')

with open('app/globals.css', 'w') as f:
    f.write(content)
