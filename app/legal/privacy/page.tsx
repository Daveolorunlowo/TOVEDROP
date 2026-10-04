export default function PrivacyPolicy() {
  return (
    <>
      <h1 className="text-3xl font-black mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">Last Updated: October 2026</p>

      <h2>1. Information We Collect</h2>
      <p>When you use Tovedrop, we collect the following data to ensure the platform functions safely and efficiently:</p>
      <ul>
        <li><strong>Account Information:</strong> Name, email address, phone number, and profile picture.</li>
        <li><strong>Location Data:</strong> To connect riders with drivers, we collect precise location data from drivers when they are "Available" or "On Trip". We also allow riders to share live tracking links.</li>
        <li><strong>Communication Data:</strong> In-app chat messages are processed through Pusher and temporarily stored to facilitate coordination between riders and drivers.</li>
        <li><strong>Transaction Data:</strong> Purchases of Drops and withdrawal requests are tracked. Note: We do not store your raw credit card numbers; payment processing is handled entirely by Paystack.</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <p>We use your data solely to provide the Tovedrop service:</p>
      <ul>
        <li>To match riders with nearby drivers and calculate optimal routes.</li>
        <li>To process Drop transactions and driver payouts.</li>
        <li>To investigate safety incidents, support tickets, or reported disputes.</li>
        <li>To send push notifications regarding ride status, chat messages, or system updates.</li>
      </ul>

      <h2>3. Data Sharing and Disclosure</h2>
      <p>Tovedrop does not sell your personal data to third-party marketers. We only share information in the following scenarios:</p>
      <ul>
        <li><strong>Between Users:</strong> Your name and profile picture are shared with your assigned driver/rider. If you use the SOS/Share feature, your location is shared with your designated contacts.</li>
        <li><strong>Service Providers:</strong> We share minimal necessary data with vendors (e.g., Paystack for payments, Vercel for hosting, Pusher for WebSockets).</li>
        <li><strong>Legal Compliance:</strong> We will disclose information to campus authorities or law enforcement if required by law or in emergency situations involving threats to physical safety.</li>
      </ul>

      <h2>4. Data Deletion</h2>
      <p>
        You have the right to request the deletion of your account and personal data. You can initiate this request by contacting Tovedrop support. Please note that certain transaction logs and audit trails may be retained for accounting and compliance purposes.
      </p>
    </>
  )
}
