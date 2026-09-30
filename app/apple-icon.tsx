import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const size = {
 width: 180,
 height: 180,
}
export const contentType = 'image/png'

export default function Icon() {
 return new ImageResponse(
 (
 <div
 
 >
 T
 </div>
 ),
 {
 ...size,
 }
 )
}
