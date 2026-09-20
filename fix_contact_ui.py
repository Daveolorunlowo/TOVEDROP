with open("app/contact/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 5: Insufficient Mobile Padding
# From: px-6 sm:px-10 lg:px-16
# To:   px-4 sm:px-8 md:px-12 lg:px-16 (better progressive scaling)
content = content.replace('className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16"', 
                          'className="max-w-4xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16"')

with open("app/contact/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Contact UI/UX fixed.")
