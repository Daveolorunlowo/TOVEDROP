import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendWelcomeEmail(email: string, name: string) {
  if (resend) {
    try {
      await resend.emails.send({
        from: 'TOVEDROP Admin <onboarding@resend.dev>',
        to: email,
        subject: `Welcome to TOVEDROP! You've got 3 free Drops.`,
        html: `<p>Hi ${name}, welcome to TOVEDROP! Enjoy your free rides.</p>`,
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // Fallback to mock
  console.log(`[MOCK EMAIL] Sending welcome email to ${name} (${email})`)
  console.log(`[MOCK EMAIL] Subject: Welcome to TOVEDROP! You've got 3 free Drops.`)
  return true
}

export async function sendAdminVerificationCode(email: string, code: string) {
  if (resend) {
    try {
      await resend.emails.send({
        from: 'TOVEDROP Security <onboarding@resend.dev>',
        to: email,
        subject: `Your Admin Verification Code`,
        html: `<p>Your code is: <strong>${code}</strong></p><p>It expires in 5 minutes.</p>`,
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  console.log(`\n╔══════════════════════════════════════╗`)
  console.log(`║   TOVEDROP ADMIN VERIFICATION CODE   ║`)
  console.log(`╠══════════════════════════════════════╣`)
  console.log(`║  To: ${email.padEnd(32)}║`)
  console.log(`║  Code: ${code.padEnd(30)}║`)
  console.log(`║  Expires in 5 minutes                ║`)
  console.log(`╚══════════════════════════════════════╝\n`)
  return true
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (resend) {
    try {
      await resend.emails.send({
        from: 'TOVEDROP Support <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
      return true;
    } catch (e) {
      console.error("Resend error:", e);
      return false;
    }
  }

  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`)
  console.log(`[MOCK EMAIL] HTML:`, html)
  return true
}

