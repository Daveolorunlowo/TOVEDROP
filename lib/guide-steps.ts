export type GuideElementType = 
  | "BUTTON" 
  | "CARD" 
  | "INPUT" 
  | "NAVIGATION" 
  | "BADGE" 
  | "ICON" 
  | "INTERACTIVE";

export interface GuideStep {
  targetSelector: string; // CSS selector
  title: string;
  body: string;
  type: GuideElementType;
  buttonLabel?: string;     // Show a button preview in the card
  requiresInteraction?: boolean;
  interactivePrompt?: string;
  fallbackPosition?: "top" | "bottom" | "left" | "right" | "center";
}

export interface GuideDefinition {
  pageKey: string;
  title: string;
  description: string;
  audience: "ALL" | "RIDER" | "DRIVER" | "ADMIN";
  steps: GuideStep[];
}

export const APP_GUIDES: Record<string, GuideDefinition> = {
  welcome: {
    pageKey: "welcome",
    title: "Welcome / Overview",
    description: "A quick tour of everything in the app.",
    audience: "ALL",
    steps: [
      {
        targetSelector: "body",
        title: "Welcome to TOVEDROP 👋",
        body: "This tour takes about 60 seconds. We'll walk you through the key parts of the app. Let's go!",
        type: "CARD",
      },
      {
        targetSelector: "#guide-nav-logo",
        title: "TOVEDROP Logo",
        body: "This is the app logo. Tap it from any page to return to your home dashboard.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-nav-drops",
        title: "Your Drops Balance",
        body: "This shows your Drops — your ride credits. 1 Drop = 1 ride booking. Tap here to top up or view your history.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-nav-profile",
        title: "Your Profile",
        body: "Tap your avatar to access your account, change settings, or sign out.",
        type: "ICON",
      }
    ]
  },
  "rider-dashboard": {
    pageKey: "rider-dashboard",
    title: "Rider Dashboard",
    description: "Your main hub for managing rides and Drops.",
    audience: "RIDER",
    steps: [
      {
        targetSelector: "#guide-dash-tabs",
        title: "Dashboard Sections",
        body: "You have 3 tabs: Overview (summary), My Trips (all your rides), and Drops & History (balance & payments).",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-drops-card",
        title: "Your Drops Balance",
        body: "The purple number is how many Drops you have. When it hits 0, you need to top up before booking.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-buy-drops-btn",
        title: "Top Up Drops",
        body: "Tap this button to buy more Drops. Packages start from ₦450 for 10 Drops. You get a 15% discount on your first top-up!",
        type: "BUTTON",
        buttonLabel: "Buy Drops",
      },
      {
        targetSelector: "#guide-book-ride-btn",
        title: "Book a Ride",
        body: "This is the main button. Tap it to schedule a ride — enter pickup, destination, date, and time. 1 Drop is spent when you confirm.",
        type: "BUTTON",
        buttonLabel: "Book a Ride",
        requiresInteraction: true,
        interactivePrompt: "Try hovering over it when you're ready to book.",
      },
      {
        targetSelector: "#guide-upcoming-trip",
        title: "Your Next Ride",
        body: "Your nearest upcoming ride shows here — driver name, vehicle, and pickup time. A green badge means your driver is confirmed.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-trip-status",
        title: "Trip Status Colours",
        body: "🟣 Purple = Confirmed · 🟠 Orange = Pending · 🔴 Red = Cancelled · 🟢 Green = Completed",
        type: "BADGE",
      },
      {
        targetSelector: "#guide-cancel-trip-btn",
        title: "Cancel a Trip",
        body: "You can cancel more than 2 hours before pickup for a full Drop refund. Cancelling within 2 hours means the Drop is lost.",
        type: "BUTTON",
        buttonLabel: "Cancel Trip",
      },
      {
        targetSelector: "#guide-tab-trips",
        title: "My Trips Tab",
        body: "Switch to this tab to see all your past and upcoming rides. You can also rate your driver from past trips.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-tab-history",
        title: "Drops & History Tab",
        body: "Every Drop you've bought, spent, or received as a refund is logged here. Full transparency.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "body",
        title: "You're all set! 🎉",
        body: "That covers the dashboard. Tap the ❓ button in the bottom-left corner anytime to replay this guide.",
        type: "CARD",
      }
    ]
  },
  "booking-flow": {
    pageKey: "booking-flow",
    title: "Booking Flow",
    description: "Learn how to book a ride.",
    audience: "RIDER",
    steps: [
      {
        targetSelector: "#guide-booking-progress",
        title: "3 Simple Steps",
        body: "Booking a ride has 3 steps: enter trip details → choose a driver → confirm. You can go back at any step before confirming.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-landmark-chips",
        title: "Quick Location Buttons",
        body: "Tap any campus landmark chip to instantly set your pickup or drop-off. These use verified GPS coordinates.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-pickup-input",
        title: "Pickup Location",
        body: "Type a location, tap the map, or select a landmark chip above. This is where your driver will pick you up.",
        type: "INPUT",
        requiresInteraction: true,
        interactivePrompt: "Tap the input to start typing.",
      },
      {
        targetSelector: "#guide-dest-input",
        title: "Destination",
        body: "Where are you going? Same options — type it, tap the map, or pick a chip. Must be within Bowen University area.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-map",
        title: "Campus Map",
        body: "Tap anywhere on the map to set a custom location not in the landmark list. The map is locked to the Bowen area.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-date-picker",
        title: "Choose Your Date",
        body: "Pick the day you need the ride. You can book up to a week ahead — plan in advance!",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-time-picker",
        title: "Choose Your Time",
        body: "Pick your pickup time. It must be at least 2 hours from now so drivers have time to prepare.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-notes-input",
        title: "Notes (Optional)",
        body: "Have luggage? Need something specific? Leave a note here — your driver sees it before accepting.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-drop-cost",
        title: "Booking Fee",
        body: "Every booking costs exactly 1 Drop. No hidden fees. The actual fare is agreed directly with your driver.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-find-drivers-btn",
        title: "Find Drivers",
        body: "When you're ready, tap this button. We'll show you all available drivers for your chosen time.",
        type: "BUTTON",
        buttonLabel: "Find Available Drivers →",
      }
    ]
  },
  "driver-selection": {
    pageKey: "driver-selection",
    title: "Choose Driver",
    description: "Select the perfect driver for your trip.",
    audience: "RIDER",
    steps: [
      {
        targetSelector: "#guide-driver-list",
        title: "Available Drivers",
        body: "These are all TOVEDROP-approved drivers available at your requested time. Every driver is ID-checked, license-verified, and vehicle-inspected.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-first-driver-card",
        title: "Reading a Driver Card",
        body: "Each card shows: name, star rating, vehicle make & model, plate number, and total trips completed.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-driver-rating",
        title: "Star Rating",
        body: "This is the average rating from past riders. ⭐ 4.5+ = excellent. Below 3.5 = proceed with caution.",
        type: "BADGE",
      },
      {
        targetSelector: "#guide-driver-verified",
        title: "Verified Badge ✓",
        body: "This orange badge means TOVEDROP has manually verified this driver's identity, license, and vehicle.",
        type: "BADGE",
      },
      {
        targetSelector: "#guide-driver-sort",
        title: "Sort Drivers",
        body: "Use these buttons to sort by highest rating or most trips completed. Pick what matters most to you.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-select-driver-btn",
        title: "Select a Driver",
        body: "Found someone you like? Tap Select. You'll see their full details on the next screen before anything is charged.",
        type: "BUTTON",
        buttonLabel: "Select Driver",
      }
    ]
  },
  "booking-confirm": {
    pageKey: "booking-confirm",
    title: "Confirm Booking",
    description: "Finalize your ride request.",
    audience: "RIDER",
    steps: [
      {
        targetSelector: "#guide-summary-card",
        title: "Trip Summary",
        body: "Review everything: pickup, destination, date, and time. If anything's wrong, tap the back button and fix it before confirming.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-selected-driver",
        title: "Your Driver",
        body: "Note the driver's name, vehicle colour, and plate number so you recognise them when they arrive.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-drops-breakdown",
        title: "Cost Breakdown",
        body: "Exactly 1 Drop is deducted when you confirm. Your new balance is shown here too.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-payment-disclaimer",
        title: "About the Fare",
        body: "The Drop is your booking fee only. The actual ride fare is agreed between you and your driver separately.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-confirm-booking-btn",
        title: "Confirm Booking",
        body: "Tapping this locks in your booking. 1 Drop is deducted immediately and your driver is notified.",
        type: "BUTTON",
        buttonLabel: "✓ Confirm Booking",
      },
      {
        targetSelector: "#guide-change-driver",
        title: "Change Driver",
        body: "Tap here to go back and pick a different driver. No Drop is spent until you tap Confirm.",
        type: "NAVIGATION",
      }
    ]
  },
  "driver-dashboard": {
    pageKey: "driver-dashboard",
    title: "Driver Dashboard",
    description: "Manage your rides and earnings.",
    audience: "DRIVER",
    steps: [
      {
        targetSelector: "#guide-stats-strip",
        title: "Your Stats",
        body: "Total trips, this week's rides, your average rating, and your wallet balance — always visible at the top.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-wallet-stat",
        title: "Your Earnings",
        body: "Every completed ride earns you ₦12 from TOVEDROP. This is on top of the fare your rider pays you directly.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-tab-requests",
        title: "Ride Requests Tab",
        body: "New trip requests appear here. When a rider books and you're available, it shows up for you to accept.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-request-card",
        title: "Request Card",
        body: "Each card shows: rider's name, pickup location, destination, date, time, and any notes they left.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-accept-btn",
        title: "Accept a Ride",
        body: "Tap Accept to take this trip. It's first-come, first-served. The moment you accept, the rider is notified.",
        type: "BUTTON",
        buttonLabel: "Accept",
      },
      {
        targetSelector: "#guide-ignore-btn",
        title: "Ignore a Request",
        body: "Can't take the trip? Just ignore it — no penalty. The ride stays available for other drivers.",
        type: "BUTTON",
        buttonLabel: "Ignore",
      },
      {
        targetSelector: "#guide-tab-mytrips",
        title: "My Trips Tab",
        body: "All the trips you've accepted live here. See what's upcoming and your full ride history.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-complete-btn",
        title: "Complete a Ride",
        body: "Tap this after you've dropped off your rider. It credits your ₦12 incentive and lets the rider rate you.",
        type: "BUTTON",
        buttonLabel: "Mark as Complete",
      },
      {
        targetSelector: "#guide-transfer-btn",
        title: "Transfer a Trip",
        body: "Can't make an accepted ride? Use this to pass it to another TOVEDROP driver. You must give a reason.",
        type: "BUTTON",
        buttonLabel: "Transfer Trip",
      },
      {
        targetSelector: "#guide-tab-wallet",
        title: "Earnings Wallet Tab",
        body: "All your ₦12 incentives accumulate here. Full transaction history. Bank payouts coming soon.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-tab-profile",
        title: "Driver Profile Tab",
        body: "Update your availability, vehicle info, and alarm settings here. Riders see parts of your profile before choosing you.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-alarm-settings",
        title: "Ride Alarms",
        body: "Set alerts for 30, 10, and 2 minutes before your pickups. Choose your alarm sound. Never miss a pickup.",
        type: "CARD",
      }
    ]
  },
  "admin-panel": {
    pageKey: "admin-panel",
    title: "Admin Panel",
    description: "Manage the TOVEDROP platform.",
    audience: "ADMIN",
    steps: [
      {
        targetSelector: "#guide-admin-sidebar",
        title: "Navigation Sidebar",
        body: "Use the sidebar to navigate: Overview, Drivers, Riders, Reports, Finances, and more.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-overview",
        title: "Platform Overview",
        body: "Live stats: total riders, approved drivers, today's trips, Drops sold, and revenue. Refreshes every page load.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-admin-activity",
        title: "Activity Feed",
        body: "Every major event — new signups, driver applications, completed rides, reports — shows up here in real time.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-admin-tab-drivers",
        title: "Drivers Section",
        body: "All driver applications live here. Pending applications are highlighted at the top — review them promptly.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-pending-row",
        title: "Review an Application",
        body: "Click any driver row to see their full profile, uploaded documents, and vehicle details.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-admin-approve-btn",
        title: "Approve a Driver",
        body: "Once you've verified their documents, tap this button. The driver gets an email and can start receiving bookings immediately.",
        type: "BUTTON",
        buttonLabel: "Approve Driver",
      },
      {
        targetSelector: "#guide-admin-tab-reports",
        title: "Safety Reports",
        body: "Riders can flag drivers after a ride. All reports land here. Review and take action where needed.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-tab-finances",
        title: "Finances Section",
        body: "Every naira that's moved through TOVEDROP — Drops sales, revenue per ride, and driver incentives paid out.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-tab-updates",
        title: "Announcements",
        body: "Publish updates, new features, or important notices to riders, drivers, or both. They see them with a bell notification.",
        type: "NAVIGATION",
      }
    ]
  },
  "rating": {
    pageKey: "rating",
    title: "Rate a Driver",
    description: "Help keep the community safe.",
    audience: "RIDER",
    steps: [
      {
        targetSelector: "#guide-rating-driver-card",
        title: "Who You're Rating",
        body: "This is the driver who completed your trip. Your honest feedback keeps TOVEDROP trustworthy for everyone.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-rating-stars",
        title: "Choose Your Stars",
        body: "Tap a star to rate from 1 to 5. ⭐⭐⭐⭐⭐ = excellent. ⭐⭐⭐ = average. Below 3 = something went wrong.",
        type: "INTERACTIVE",
        requiresInteraction: true,
      },
      {
        targetSelector: "#guide-rating-note",
        title: "Leave a Note (Optional)",
        body: "Was the driver early? Professional? A short note helps future riders. Takes 30 seconds.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-rating-submit",
        title: "Submit Rating",
        body: "Once you submit, the rating can't be changed. The driver's average updates right away. Thank you!",
        type: "BUTTON",
        buttonLabel: "Submit Rating",
      }
    ]
  }
};
