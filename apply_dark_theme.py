import re

with open('app/globals.css', 'r') as f:
    content = f.read()

# Replace the specific variables inside the .dark block
replacements_dark = {
    '--bg-deep: #000000; /* Pure Black for that premium dark look */': '--bg-deep: #1A1A1A; /* Grey Black */',
    '--surface-card: #0A0A0A;': '--surface-card: #222222;',
    '--surface-elevated: #171717;': '--surface-elevated: #2A2A2A;',
    '--border-subtle: #262626;': '--border-subtle: #3F1346;',
    '--border-default: #404040;': '--border-default: #3F1346;',
    '--brand-primary: #A855F7; /* Vibrant purple that pops against black */': '--brand-primary: #3F1346; /* Deep Purple */'
}

for old, new_val in replacements_dark.items():
    content = content.replace(old, new_val)

with open('app/globals.css', 'w') as f:
    f.write(content)
