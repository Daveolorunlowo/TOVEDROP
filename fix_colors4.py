with open('app/globals.css', 'r') as f:
    content = f.read()

replacements = {
    '--bg-deep: #362233;': '--bg-deep: #4A221C;',
    '--surface-card: #452C42;': '--surface-card: #5C2D26;',
    '--surface-elevated: #543750;': '--surface-elevated: #6E3830;',
    '--border-subtle: #664461;': '--border-subtle: #82453B;',
    '--border-default: #664461;': '--border-default: #82453B;'
}

for old, new_val in replacements.items():
    content = content.replace(old, new_val)

with open('app/globals.css', 'w') as f:
    f.write(content)
