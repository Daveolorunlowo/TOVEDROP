with open("app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Hide scrollbar in the sidebar
old_str = 'className="flex-1 overflow-y-auto py-6 px-4 space-y-1"'
new_str = 'className="flex-1 overflow-y-auto py-6 px-4 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:\'none\'] [scrollbar-width:\'none\']"'
content = content.replace(old_str, new_str)

with open("app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Sidebar scrollbar hidden.")
