import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = {
        r"'#1e1e1e'": "'var(--border)'",
        r"'rgba\(255,255,255,0.08\)'": "'var(--border)'",
        r"'#2a2a2a'": "'var(--muted-foreground)'",
        r"'#555'": "'var(--muted-foreground)'",
    }
    
    for pattern, repl in replacements.items():
        content = re.sub(pattern, repl, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('components/dashboard/TripList.tsx')
