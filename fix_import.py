import re

with open("app/contact/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find the lucide-react import
# e.g., import { Mail, Phone, MapPin, ArrowRight, ExternalLink } from 'lucide-react'
content = re.sub(r"import \{ (.*?) \} from 'lucide-react'", r"import { \1, Lightbulb } from 'lucide-react'", content)

with open("app/contact/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Added Lightbulb import")
