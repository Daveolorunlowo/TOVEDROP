import re

with open('components/chat-modal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('throw new Error("Failed to send")', 'const text = await res.text(); throw new Error(`Failed to send: ${res.status} ${text}`)')
content = content.replace('alert("Failed to send message")', 'alert(err.message)')

with open('components/chat-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
