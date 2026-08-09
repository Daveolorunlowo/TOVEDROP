export async function sendWelcomeEmail(email: string, name: string) {
  // In a real app, integrate with Resend, SendGrid, etc.
  console.log(`[MOCK EMAIL] Sending welcome email to ${name} (${email})`)
  console.log(`[MOCK EMAIL] Subject: Welcome to TOVEDROP! You've got 3 free Drops.`)
  return true
}

export async function sendAdminVerificationCode(email: string, code: string) {
  // In production, send via Resend/SendGrid. In dev, log to console.
  console.log(`\n╔══════════════════════════════════════╗`)
  console.log(`║   TOVEDROP ADMIN VERIFICATION CODE   ║`)
  console.log(`╠══════════════════════════════════════╣`)
  console.log(`║  To: ${email.padEnd(32)}║`)
  console.log(`║  Code: ${code.padEnd(30)}║`)
  console.log(`║  Expires in 5 minutes                ║`)
  console.log(`╚══════════════════════════════════════╝\n`)
  return true
}

export async function sendEmail(to: string, template: string, data: any) {
  console.log(`[MOCK EMAIL] To: ${to} | Template: ${template}`)
  console.log(`[MOCK EMAIL] Data:`, data)
  return true
}
