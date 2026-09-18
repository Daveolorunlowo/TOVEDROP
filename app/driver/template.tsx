'use client'

export default function DriverTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className='animate-in slide-in-from-bottom-[8px] fade-in duration-[400ms] ease-out fill-mode-both'>
      {children}
    </div>
  )
}