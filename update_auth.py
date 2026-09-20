with open("app/auth/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('<Link href="#" className="text-xs text-orange-brand hover:underline font-medium">Forgot password?</Link>', '<Link href="/auth/reset-password" className="text-xs text-orange-brand hover:underline font-medium">Forgot password?</Link>')
content = content.replace('<Link href="#" className="text-orange-brand hover:underline">Terms of Service</Link>', '<Link href="/terms" className="text-orange-brand hover:underline">Terms of Service</Link>')
content = content.replace('<Link href="#" className="text-orange-brand hover:underline">Privacy Policy</Link>', '<Link href="/privacy" className="text-orange-brand hover:underline">Privacy Policy</Link>')

with open("app/auth/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated auth page")
