import re

with open("app/auth/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: Low Contrast on Form Labels
# From: <Label ... className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">
# To:   <Label ... className="text-xs font-bold uppercase tracking-wider text-foreground/80">
content = re.sub(r'className="text-\[11px\] font-semibold uppercase tracking-\[0\.05em\] text-muted"', 
                 r'className="text-xs font-bold uppercase tracking-wider text-foreground/80"', content)

# Fix 2: Error Message Legibility
# From: text-red-600
# To:   text-red-400
content = content.replace('text-red-600', 'text-red-400 font-medium')

# Fix 3: Missing Focus Indicators (increase from ring-1 to ring-2 and add offset)
content = content.replace('focus:ring-1 focus:ring-orange-brand/50', 'focus:ring-2 focus:ring-orange-brand focus:ring-offset-2 focus:ring-offset-background')

# Fix 4: Small Click Targets on Legal Links
# Add block padding to the links so they are easier to tap
content = content.replace('<Link href="/terms" className="text-orange-brand hover:underline">Terms of Service</Link>', 
                          '<Link href="/terms" className="text-orange-brand hover:underline p-1 inline-block">Terms of Service</Link>')
content = content.replace('<Link href="/privacy" className="text-orange-brand hover:underline">Privacy Policy</Link>',
                          '<Link href="/privacy" className="text-orange-brand hover:underline p-1 inline-block">Privacy Policy</Link>')

with open("app/auth/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Auth UI/UX fixed.")
