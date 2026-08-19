import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: 'linear-gradient(135deg, #e8590c 0%, #f97316 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--foreground)',
          borderRadius: '24%',
          fontWeight: 900,
          fontFamily: 'sans-serif',
          boxShadow: '0 4px 6px -1px rgba(232, 89, 12, 0.4)',
        }}
      >
        T
      </div>
    ),
    {
      ...size,
    }
  )
}
