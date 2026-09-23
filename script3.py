import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = {
        r"'#555'": "'var(--muted-foreground)'",
        r"'#888'": "'var(--text-secondary)'",
        r"'#666'": "'var(--muted-foreground)'",
        r"'#444'": "'var(--border)'",
    }
    
    for pattern, repl in replacements.items():
        content = re.sub(pattern, repl, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('app/driver/page.tsx')
