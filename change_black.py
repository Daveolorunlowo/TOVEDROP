import re

with open('app/globals.css', 'r') as f:
    content = f.read()

content = content.replace('--bg-deep: #0A0A0F;', '--bg-deep: #121212;')
content = content.replace('--surface-card: #131318;', '--surface-card: #1A1A1A;')
content = content.replace('--surface-elevated: #1A1A21;', '--surface-elevated: #242424;')

with open('app/globals.css', 'w') as f:
    f.write(content)
