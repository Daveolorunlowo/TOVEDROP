import re

with open('app/admin/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("border: `1px solid 30`", "border: `1px solid ${s.color}30`")

with open('app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
