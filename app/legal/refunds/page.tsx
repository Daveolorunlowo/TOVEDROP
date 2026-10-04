export default function RefundPolicy() {
  return (
    <>
      <h1 className="text-3xl font-black mb-8">Refund & Dispute Policy</h1>
      <p className="text-muted-foreground mb-8">Last Updated: October 2026</p>

      <p>
        Because Tovedrop uses a virtual currency ("Drops"), this policy explains how and when Drops are returned to your wallet or refunded to your bank.
      </p>

      <h2>1. Ride Cancellations</h2>
      <p>When you book a ride, the required Drops are temporarily placed in escrow.</p>
      <ul>
        <li><strong>If you cancel before a driver accepts:</strong> 100% of the Drops are instantly returned to your wallet.</li>
        <li><strong>If the driver cancels the trip:</strong> 100% of the Drops are instantly returned to your wallet.</li>
        <li><strong>If you cancel after a driver is on their way:</strong> A cancellation fee (deducted in Drops) may apply to compensate the driver for their time and fuel.</li>
      </ul>

      <h2>2. Disputed Trips</h2>
      <p>
        If a trip is marked as "Completed" but you did not actually receive the ride, you must report the issue via the in-app Support channel within 24 hours. Tovedrop administrators will review the GPS logs and chat history. If the dispute is resolved in your favor, the Drops will be refunded to your wallet.
      </p>

      <h2>3. Refunds to Bank Accounts (Fiat)</h2>
      <p>
        Purchases of Drops are generally <strong>non-refundable</strong> to your fiat bank account or debit card. Drops are meant to be used for rides on the platform.
      </p>
      <p>
        However, in exceptional circumstances (e.g., accidental duplicate purchases, severe platform outages), you may contact support within 7 days of the transaction. Fiat refunds are processed at the sole discretion of Tovedrop administration and may take 5-10 business days to reflect in your account, minus any payment gateway processing fees.
      </p>

      <h2>4. Driver Payout Disputes</h2>
      <p>
        If a driver believes a payout calculation is incorrect, they must raise a ticket within 7 days of the completed withdrawal. Discrepancies will be cross-referenced against the 70/10/20 commission logs.
      </p>
    </>
  )
}
