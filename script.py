import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic replacements for text/bg colors to use CSS variables
    replacements = {
        r'bg-\[\#14151a\]': 'bg-card',
        r'bg-\[\#0e0e11\]': 'bg-background',
        r'bg-\[\#1c1d24\]': 'bg-muted',
        r'bg-\[\#0F0F20\]': 'bg-background',
        r'bg-\[\#080814\]': 'bg-background',
        r'bg-\[\#0C0C1E\]': 'bg-muted',
        r'border-\[\#0E0E24\]': 'border-border',
        r'hover:bg-\[\#1c1d24\]': 'hover:bg-muted',
        r'text-white/10': 'text-muted-foreground',
        r'text-white/30': 'text-muted-foreground',
        r'text-white/40': 'text-muted-foreground',
        r'text-white/50': 'text-muted-foreground',
        r'text-white/70': 'text-muted-foreground',
        r'border-white/\[0\.04\]': 'border-border',
        r'border-white/5': 'border-border',
        r'border-white/10': 'border-border',
        r'text-white': 'text-foreground',
        r'fill="\#0F0F20"': 'fill="var(--background)"',
        r"background: '\#0F0F20'": "background: 'var(--background)'",
        r"background: '\#080814'": "background: 'var(--background)'",
        r"background: '\#0C0C1E'": "background: 'var(--muted)'",
        r'fill="\#060611"': 'fill="var(--card)"',
        r"backgroundColor: '\#14151a'": "backgroundColor: 'var(--card)'",
        r"color: 'white'": "color: 'var(--foreground)'",
    }
    
    for pattern, repl in replacements.items():
        content = re.sub(pattern, repl, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('app/admin/page.tsx')
process_file('app/page.tsx')
