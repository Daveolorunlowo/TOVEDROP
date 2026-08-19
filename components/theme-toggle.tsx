"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:border-orange-brand/50 transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 text-muted-foreground transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 text-muted-foreground rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
}
