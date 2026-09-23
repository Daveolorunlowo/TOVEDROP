import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = {
        r"'#aaa'": "'var(--text-secondary)'",
        r"hover:border-\[\#555\]": "hover:border-foreground/20",
    }
    
    for pattern, repl in replacements.items():
        content = re.sub(pattern, repl, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('components/global-message-listener.tsx')
process_file('components/driver-trip-listener.tsx')
