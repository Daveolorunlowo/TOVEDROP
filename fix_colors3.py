with open('app/globals.css', 'r') as f:
    content = f.read()

replacements = {
    '--bg-deep: #1E293B;': '--bg-deep: #362233;',
    '--surface-card: #273449;': '--surface-card: #452C42;',
    '--surface-elevated: #334155;': '--surface-elevated: #543750;',
    '--border-subtle: #475569;': '--border-subtle: #664461;',
    '--border-default: #475569;': '--border-default: #664461;'
}

for old, new_val in replacements.items():
    content = content.replace(old, new_val)

with open('app/globals.css', 'w') as f:
    f.write(content)
