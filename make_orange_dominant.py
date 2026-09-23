import re

with open('app/globals.css', 'r') as f:
    content = f.read()

content = content.replace('--brand-primary: #8B5CF6;', '--brand-primary: #F97316;')
content = content.replace('--sidebar-primary: var(--brand-primary);', '--sidebar-primary: #F97316;')
# Also, let's make sure the --accent uses purple since primary is now orange
content = content.replace('--accent: var(--orange-brand);', '--accent: var(--purple-brand);')

with open('app/globals.css', 'w') as f:
    f.write(content)
