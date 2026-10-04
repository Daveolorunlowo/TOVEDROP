import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    
    // Get the internal Python URL from environment variables, fallback to localhost for dev
    const pythonUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${pythonUrl}/api/verify-id`, {
      method: 'POST',
      body: formData,
      // Pass along any necessary headers if the python service eventually requires auth
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to verify ID with external service' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('KYC Proxy Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    )
  }
}
