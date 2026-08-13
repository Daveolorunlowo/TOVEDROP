import twilio from 'twilio';

const client = process.env.TWILIO_ACCOUNT_SID 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export async function sendWhatsApp(toPhoneNumber: string, message: string) {
  if (!client || !toPhoneNumber) {
    console.log(`[WhatsApp - not sent, no client/number] To: ${toPhoneNumber} — ${message}`);
    return;
  }

  try {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${toPhoneNumber}`,
      body: message,
    });
  } catch (error) {
    console.error('WhatsApp send failed:', error);
    // Do not throw — WhatsApp failure should never block the 
    // core action (trip confirmation, etc.) from completing. 
    // Email remains the reliable fallback channel.
  }
}
