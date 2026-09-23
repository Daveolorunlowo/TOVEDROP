import re

with open('app/globals.css', 'r') as f:
    content = f.read()

replacements = {
    '--bg-deep: #121212;': '--bg-deep: #212121;',
    '--surface-card: #1A1A1A;': '--surface-card: #2C2C2C;',
    '--surface-elevated: #242424;': '--surface-elevated: #363636;',
    '--brand-primary: #F97316;': '--brand-primary: #FF7300;',
    '--orange-brand: #F97316;': '--orange-brand: #FF7300;',
    '--orange-dark: #EA6C0A;': '--orange-dark: #E65C00;',
    '--status-warning: #F97316;': '--status-warning: #FF7300;',
    '--sidebar-primary: #F97316;': '--sidebar-primary: #FF7300;'
}

for old, new_val in replacements.items():
    content = content.replace(old, new_val)

with open('app/globals.css', 'w') as f:
    f.write(content)
