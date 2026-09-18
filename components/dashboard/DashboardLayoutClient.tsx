'use client'

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
 return (
 <div className="flex min-h-screen bg-background text-foreground w-full">
 <main className="flex-1 w-full min-w-0">
 {children}
 </main>
 </div>
 )
}

