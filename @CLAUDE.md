# TOVEDROP Business Logic & Context

## Project Overview
TOVEDROP is a ride-booking platform with Riders, Drivers, and Admins.
- **Riders** purchase "Drops" and use them to book rides (1 Drop = 1 Ride).
- **Drivers** apply, get approved by admins, and accept ride requests.
- **Admins** manage the entire platform.

## Known Temporary States

- **AUTO_APPROVE_DRIVERS** is currently enabled in `.env.local` for development/testing purposes. This bypasses manual driver vetting. MUST be set to false (or removed entirely) before real users start applying as drivers in production, since driver vetting is a core trust/safety feature of TOVEDROP.

---

## BUSINESS LOGIC — SOURCE OF TRUTH

### RIDER FLOW:

1. Rider registers an account (name, email, university, password).

2. **FIRST-TIME TOP-UP DISCOUNT:**
   - The very first time a rider tops up (buys) Drops, they get a 15% discount on that purchase.
   - Applies ONLY to the first purchase ever made by that user.
   - Track with a boolean flag on the User model (e.g., `hasUsedFirstTopupDiscount`) that flips to true the moment their first purchase completes successfully.
   - The discount reduces the NAIRA price paid, not the Drops received (e.g., Popular package is normally ₦2,000 for 120 Drops, first-time buyers pay ₦1,700 but still receive the full 120 Drops).
   - Calculate and display this discount clearly on the buy-drops page before they pay.
   - Enforce it server-side in the Paystack initialization step (never trust a discount amount sent from the client).

3. To book a ride: Rider fills in pickup, destination, date, time, optional notes. This costs 1 Drop.

4. On submitting the request:
   - 1 Drop is deducted immediately.
   - Trip is created with status `PENDING` and `driverId` set to `null`.
   - This is an OPEN request — not sent to one specific driver.

5. The request becomes visible to ALL available/approved drivers whose availability matches the requested day and time. Each driver can independently either IGNORE it or ACCEPT it.

6. **The first driver to accept wins the trip:**
   - MUST be implemented as an atomic, conditional database update to prevent two drivers from both accepting the same trip in a race condition.
   - Do NOT implement this as read-then-write in separate steps. Use the conditional `updateMany` pattern:
     ```javascript
     const result = await prisma.trip.updateMany({
       where: { id: tripId, status: 'PENDING', driverId: null },
       data: { status: 'CONFIRMED', driverId: currentDriverId }
     });
     if (result.count === 0) {
       // someone else already took it — reject gracefully
     }
     ```

7. The MOMENT a driver accepts and wins the trip, the rider must be notified immediately:
   - Send an email right away with full driver details (name, vehicle, plate, rating).
   - If the rider currently has their dashboard open, implement polling (fetch trip status every 15-20 seconds while any trip is PENDING) so they see the update without manually refreshing, and show a toast: "🎉 [Driver] accepted your ride!"

8. The ride itself happens off-platform (not tracked in real-time).

9. **ONLY THE DRIVER can mark the trip as completed:**
   - This should only be possible after the scheduled trip time has passed.
   - On completion: trip status becomes `COMPLETED`, `Driver.totalTrips` increments by 1.
   - Rider is immediately notified with a prompt to review.

10. **Review/Rating:**
    - ONLY after the driver has marked the trip `COMPLETED` can the rider access the review/rating page for that trip.
    - Enforce this server-side: reject access to `/rate/[tripId]` unless `trip.status === 'COMPLETED'`, `trip.riderId` matches the logged-in user, and no rating already exists for this trip.
    - Rider selects 1-5 stars and can optionally leave a note.
    - On submit, recalculate the driver's average rating.

### DRIVER FLOW:

1. Driver registers with BOTH their personal details AND their vehicle details in one application (name, phone, email, area, bio, license number, vehicle make/model/color/type/plate, document uploads, availability days/hours, preferred areas).
   - Driver status starts as `PENDING` and must be approved by an admin before they can receive any bookings.

2. Once approved, whenever a rider makes an open trip request matching the driver's availability, the driver is notified (shown in their "Incoming Requests" dashboard section, plus email notification).

3. Driver can either IGNORE the request or ACCEPT it.

4. If they accept and win the race, the trip is now theirs and appears in their "Upcoming Confirmed Trips" section with the rider's first name, pickup, destination, date/time.

5. After the scheduled trip time has passed, the driver sees a "Mark as Completed" button. Clicking it finalizes the trip and triggers the rider's review prompt.

### ADMIN FLOW:

Build a complete admin panel at `/admin` that monitors and manages EVERYTHING happening on the platform:

- **Overview dashboard:** Total riders, total drivers (approved/pending breakdown), trips today, trips this week, Drops sold this month, estimated Naira revenue this month, recent activity feed (last 10 platform events across all users).
- **Drivers tab:** Full list with filters by status, approve/reject/suspend/reinstate actions, click into any driver for a full profile with uploaded documents and history.
- **Riders tab:** Searchable list of all riders with their Drops balance, total trips, and whether they've used their first-time discount yet.
- **Trips tab:** Every trip on the platform regardless of status, filterable by status and date range, with CSV export.
- **Reports tab:** Any driver reports submitted by riders, with review/resolve/dismiss/suspend-driver actions.

Admin should be able to see and act on literally everything happening on TOVEDROP from this panel.

---

## BUILD INSTRUCTIONS & PLAN

1. **Database Schema (Prisma):** Add User (`hasUsedFirstTopupDiscount`), Driver, Trip, Notification/Events, etc.
2. **Authentication/Roles:** Middleware for rider/driver/admin routing.
3. **Rider:** Booking flow (open request).
4. **Driver:** Incoming requests with atomic accept logic.
5. **Notification System:** Email + polling.
6. **Driver:** Mark-as-completed flow.
7. **Rider:** Review/rating flow with proper access gating.
8. **First-time top-up discount:** Frontend display + backend enforcement (Paystack).
9. **Admin Panel:** Complete overview and management tabs.
10. **UI Polish:** Tailwind CSS, pure CSS animations (no Framer Motion).

Testing must be done for all critical flows as specified in the business logic before confirming completion.
