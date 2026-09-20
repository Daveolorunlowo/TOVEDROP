import re

with open("app/layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
import_stmt = "import { ServiceWorkerRegistry } from '@/components/sw-registry'\nimport { WelcomeOverlay } from '@/components/shared/WelcomeOverlay'"
content = content.replace("import { WelcomeOverlay } from '@/components/shared/WelcomeOverlay'", import_stmt)

# Add component
comp_stmt = "<GlobalMessageListener />\n        <ServiceWorkerRegistry />\n        <WelcomeOverlay />"
content = content.replace("<GlobalMessageListener />\n <WelcomeOverlay />", comp_stmt)

with open("app/layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated layout")
