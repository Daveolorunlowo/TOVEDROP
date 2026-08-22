export async function sendWhatsAppMessage(to: string, message: string) {
  // TODO: Implement actual WhatsApp API integration (e.g. Twilio, Meta Graph API)
  console.log(`[WhatsApp Mock] Sending to ${to}:\n${message}`)
  
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return { success: true }
}
