with open('app/globals.css', 'r') as f:
    content = f.read()

replacements = {
    '--bg-deep: #09090B;': '--bg-deep: #1E293B;',
    '--surface-card: #111116;': '--surface-card: #273449;',
    '--surface-elevated: #1F1F2E;': '--surface-elevated: #334155;',
    '--border-subtle: #27273A;': '--border-subtle: #475569;',
    '--border-default: #27273A;': '--border-default: #475569;'
}

for old, new_val in replacements.items():
    content = content.replace(old, new_val)

with open('app/globals.css', 'w') as f:
    f.write(content)
