// Base cost per drop in Naira
export const DROP_PRICE_NAIRA = 100; // 1 Drop = 100 Naira

// Flat incentive paid to the driver for every completed 
// ride booked through TOVEDROP — this comes out of the 
// rider's booking fee (1 Drop), it is NOT part of the 
// transport fare, which the rider pays the driver directly
export const DRIVER_COMPLETION_INCENTIVE = 12; // Naira

export const DROP_PACKAGES = [
  { id: 'single', name: 'Single Drop', naira: 100, drops: 1 },
  { id: 'starter', name: 'Starter', naira: 1000, drops: 10 },
  { id: 'popular', name: 'Popular', naira: 2000, drops: 20, badge: 'Best Value' },
  { id: 'campus_pro', name: 'Campus Pro', naira: 5000, drops: 50 },
  { id: 'semester', name: 'Semester', naira: 10000, drops: 100, badge: 'Most Drops' },
];

export const FIRST_PURCHASE_DISCOUNT_PERCENTAGE = 0.15;
