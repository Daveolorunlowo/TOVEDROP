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
        targetSelector: "body", // Full screen
        title: "Welcome to TOVEDROP 👋",
        body: "You're about to get a quick tour of everything in the app. It takes about 60 seconds. Let's go.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-nav-logo",
        title: "This is TOVEDROP",
        body: "The platform built for Bowen University students who are tired of missing class because there was no cab. You're about to fix that permanently.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-nav-drops",
        title: "Your Drops",
        body: "Drops are how you pay for bookings on TOVEDROP. 1 Drop = 1 ride booking. Think of them as prepaid ride credits. You can top up anytime.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-nav-profile",
        title: "Your Profile",
        body: "Tap your avatar to access your account settings, sign out, or view your profile. Your initials are shown when you have no photo set.",
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
        title: "Your Dashboard Has Three Sections",
        body: "Overview shows your snapshot. My Trips shows all your rides. Drops & History shows your balance and payment history. You're on Overview right now.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-drops-card",
        title: "Your Drops Balance",
        body: "This shows how many Drops you currently have. The purple number is what you can spend right now. When it hits 0, you need to top up before booking another ride.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-buy-drops-btn",
        title: "Top Up Your Drops",
        body: "Tap this to buy more Drops. Packages start from ₦450 for 10 Drops — enough for 10 ride bookings. You get a 15% discount on your very first top-up.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-book-ride-btn",
        title: "Book a Ride — This is the Big One",
        body: "Tap this to schedule a ride. You enter your pickup spot, where you're going, date, and time. 1 Drop is spent when you confirm. That's it.",
        type: "BUTTON",
        requiresInteraction: true,
        interactivePrompt: "Try hovering over it when you're ready for your first real booking.",
      },
      {
        targetSelector: "#guide-upcoming-trip",
        title: "Your Next Ride",
        body: "Your most upcoming confirmed trip shows here. You can see your driver's name, vehicle, and the exact pickup time. Green badge means your driver is confirmed and ready.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-trip-status",
        title: "What These Colours Mean",
        body: "Purple = Confirmed (driver found). Orange = Pending (waiting for a driver). Red = Cancelled. Green = Completed. You'll see these across all your trip cards.",
        type: "BADGE",
      },
      {
        targetSelector: "#guide-cancel-trip-btn",
        title: "Cancelling a Trip",
        body: "You can cancel more than 2 hours before pickup and get your Drop refunded. Cancel within 2 hours and the Drop is spent — so plan carefully.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-tab-trips",
        title: "All Your Rides",
        body: "Switch here to see ALL your upcoming and past trips in one place. Past trips let you rate your driver — your reviews help keep TOVEDROP trustworthy.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-tab-history",
        title: "Your Drop History",
        body: "Every Drop you've ever bought, spent, or received as a refund is logged here. Full transparency — you can always see exactly where your Drops went.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "body",
        title: "You're all set! 🎉",
        body: "That's your dashboard. Tap the ? button anytime in the bottom-left to replay this guide. Ready to book your first ride?",
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
        title: "Three Simple Steps",
        body: "Booking a ride is a 3-step process: enter your trip details, choose a driver, then confirm. You can go back at any step before confirming.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-landmark-chips",
        title: "Quick Locations",
        body: "Tap any of these campus landmarks to instantly set your pickup or destination. These are pre-verified GPS coordinates — 100% accurate.",
        type: "NAVIGATION", 
      },
      {
        targetSelector: "#guide-pickup-input",
        title: "Set Your Pickup",
        body: "Type a location name or tap the map below to drop a pin. You can also select from the quick landmarks above. This is where your driver will come to find you.",
        type: "INPUT",
        requiresInteraction: true,
        interactivePrompt: "Try focusing the input.",
      },
      {
        targetSelector: "#guide-dest-input",
        title: "Set Your Destination",
        body: "Where do you need to go? Same as pickup — type, tap the map, or use a landmark chip. Both must be within Bowen University campus and surroundings.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-map",
        title: "The Campus Map",
        body: "The map is locked to Bowen University's area only. Tap anywhere on the map to drop a pin for a custom location not in the landmark list.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-date-picker",
        title: "Choose Your Date",
        body: "Pick the day you need the ride. You can book as far in advance as you like — even a week ahead. That's what makes TOVEDROP powerful.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-time-picker",
        title: "Choose Your Time",
        body: "Pick your pickup time. It must be at least 2 hours from now so drivers have time to prepare and accept your request.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-notes-input",
        title: "Notes for Your Driver (Optional)",
        body: "Have luggage? Need a specific type of vehicle? Let your driver know here. They see this note before accepting your trip.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-drop-cost",
        title: "Your Booking Fee",
        body: "This booking costs exactly 1 Drop. No extra charges, no surprise fees. The actual transport fare is agreed directly with your driver.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-find-drivers-btn",
        title: "Find Available Drivers",
        body: "When you're happy with the details, tap this. TOVEDROP searches for approved drivers available for your chosen date and time.",
        type: "BUTTON",
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
        body: "These are all the TOVEDROP-approved drivers available for your requested time. Every driver on this list has been personally vetted — ID checked, license verified, vehicle inspected.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-first-driver-card",
        title: "Reading a Driver Card",
        body: "Each card shows the driver's name, star rating, vehicle details, plate number, and total rides completed. More completed rides means more experience with campus routes.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-driver-rating",
        title: "The Star Rating",
        body: "This is the average rating from real students who've ridden with this driver before. Anything above 4.5 is excellent. Below 3.5 means proceed with caution.",
        type: "BADGE",
      },
      {
        targetSelector: "#guide-driver-verified",
        title: "Verified Driver Badge",
        body: "This orange badge means TOVEDROP has manually reviewed this driver's identity, license, and vehicle. You should ONLY see verified drivers on this list.",
        type: "BADGE",
      },
      {
        targetSelector: "#guide-driver-sort",
        title: "Sort Your Options",
        body: "Use these filters to sort drivers by highest rating or most completed trips. Choose based on what matters more to you — experience or reputation.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-select-driver-btn",
        title: "Select Your Driver",
        body: "When you find a driver you want, tap Select. You'll see their full details on the next step before anything is confirmed or charged.",
        type: "BUTTON",
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
        title: "Your Trip Summary",
        body: "Review everything before committing. Pickup, destination, date, time — all shown here. If anything looks wrong, go back and correct it before confirming.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-selected-driver",
        title: "Your Selected Driver",
        body: "This is who will pick you up. Note their name, vehicle colour, and plate number so you recognise them when they arrive.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-drops-breakdown",
        title: "The Cost Breakdown",
        body: "Exactly 1 Drop will leave your balance when you confirm. Your new balance is shown here too — no surprises.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-payment-disclaimer",
        title: "About the Transport Fare",
        body: "TOVEDROP handles the booking only — the Drop is your booking fee. The actual ride fare is agreed directly between you and your driver before or after the trip.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-confirm-booking-btn",
        title: "The Point of No Return",
        body: "Tapping this locks in your booking. 1 Drop is deducted immediately. Your driver is notified and the ride is confirmed.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-change-driver",
        title: "Changed Your Mind?",
        body: "If you want a different driver, tap here to go back to the driver list. No Drop is spent until you tap the confirm button above.",
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
        title: "Your At-a-Glance Stats",
        body: "Total trips, this week's rides, your average rating, and your wallet balance — all at the top so you always know where you stand.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-wallet-stat",
        title: "Your TOVEDROP Earnings",
        body: "Every ride you complete earns you a flat ₦12 incentive from TOVEDROP. This is separate from the fare your rider pays you directly. It adds up over time.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-tab-requests",
        title: "Incoming Ride Requests",
        body: "This is where new trip requests from riders appear. When a rider books an open trip that matches your availability, it shows up here for you to accept or ignore.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-request-card",
        title: "Reading a Request Card",
        body: "Each card shows: rider's first name, pickup location, destination, scheduled date and time, and any special notes they left. Review it carefully before accepting.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-accept-btn",
        title: "Accepting a Ride",
        body: "Tap Accept to take this trip. It's first come first served — other drivers see this same request. The moment you accept, the rider is notified with your full details.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-ignore-btn",
        title: "Ignoring a Request",
        body: "If you can't take a trip, simply ignore it — it stays available for other drivers. There's no penalty for ignoring, but frequent acceptance builds your reputation and rating.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-tab-mytrips",
        title: "Your Confirmed Rides",
        body: "All the trips you've accepted live here. Upcoming shows what's ahead. Completed shows your full ride history and earnings per trip.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-complete-btn",
        title: "Completing a Ride",
        body: "After you've dropped your rider off, tap this. It signals the ride is done, credits your ₦12 wallet incentive, and allows the rider to rate you. Only tap when the ride is genuinely finished.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-transfer-btn",
        title: "Can't Make It? Transfer the Trip",
        body: "If an emergency means you can't complete an accepted ride, use this to pass it to a fellow TOVEDROP driver. You must provide a reason, and your earnings for that trip transfer too.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-tab-wallet",
        title: "Your Earnings Wallet",
        body: "Every ₦12 incentive from completed rides accumulates here. Full transaction history is logged. Payouts to your bank account are coming soon.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-tab-profile",
        title: "Your Driver Profile",
        body: "Update your availability, preferred areas, bio, and alarm preferences here. Riders see parts of your profile before choosing you, so keep it complete and accurate.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-alarm-settings",
        title: "Ride Alarms",
        body: "Set alerts for 30 minutes, 10 minutes, and 2 minutes before your pickups. Choose your alarm sound and vibration intensity. Never miss a pickup again.",
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
        title: "Your Control Center",
        body: "The sidebar is your navigation across all admin functions: Overview, Drivers, Riders, Trips, Reports, Finances, and Updates.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-overview",
        title: "Platform at a Glance",
        body: "Total riders, approved drivers, today's trips, Drops sold, and revenue — all live. These numbers update every time you refresh.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-admin-activity",
        title: "Activity Feed",
        body: "Every significant event across the platform appears here in real time — new signups, driver applications, completed rides, and reports.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-admin-tab-drivers",
        title: "Managing Drivers",
        body: "All driver applications — pending and approved — live here. Pending applications appear at the top highlighted. This is your most time-sensitive responsibility.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-pending-row",
        title: "Reviewing an Application",
        body: "Click any driver row to see their full profile, uploaded documents, and vehicle details. You must manually approve before they can receive any bookings.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-admin-approve-btn",
        title: "Approving a Driver",
        body: "Once you've verified their documents, tap Approve. They receive an email immediately and gain access to the driver dashboard. This is irreversible without a suspension.",
        type: "BUTTON",
      },
      {
        targetSelector: "#guide-admin-tab-reports",
        title: "Safety Reports",
        body: "Riders can flag drivers for bad behaviour after a ride. All reports land here. Review each one and take action — suspend the driver if warranted.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-tab-finances",
        title: "Platform Revenue",
        body: "Every naira that has moved through TOVEDROP is tracked here — cash collected from Drops sales, recognized revenue per completed ride, and total driver incentives paid out.",
        type: "NAVIGATION",
      },
      {
        targetSelector: "#guide-admin-tab-updates",
        title: "Publishing Announcements",
        body: "Use this to publish platform updates, new features, or important notices to riders, drivers, or both. Users see these in their Updates section with a bell notification.",
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
        body: "This is the driver who completed your trip. Your honest rating helps other students make informed choices and keeps TOVEDROP trustworthy.",
        type: "CARD",
      },
      {
        targetSelector: "#guide-rating-stars",
        title: "Choose Your Rating",
        body: "Tap a star to rate 1 to 5. 5 stars means excellent. 3 is average. Below 3 means something went wrong — consider leaving a note.",
        type: "INTERACTIVE",
        requiresInteraction: true,
      },
      {
        targetSelector: "#guide-rating-note",
        title: "Leave a Note (Optional)",
        body: "Was the driver early? Professional? Or the opposite? A short note helps future riders know what to expect. Takes 30 seconds and makes a real difference.",
        type: "INPUT",
      },
      {
        targetSelector: "#guide-rating-submit",
        title: "Submit Your Rating",
        body: "Once submitted, ratings cannot be changed. The driver's average updates immediately. Thank you for keeping TOVEDROP safe.",
        type: "BUTTON",
      }
    ]
  }
};
