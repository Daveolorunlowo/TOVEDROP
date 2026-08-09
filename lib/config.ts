// Flat incentive paid to the driver for every completed 
// ride booked through TOVEDROP — this comes out of the 
// rider's booking fee (1 Drop), it is NOT part of the 
// transport fare, which the rider pays the driver directly
export const DRIVER_COMPLETION_INCENTIVE = 12; // Naira

export const DROP_PACKAGES = [
  { id: 'starter', name: 'Starter', naira: 450, drops: 10 },
  { id: 'popular', name: 'Popular', naira: 800, drops: 20, badge: 'Best Value' },
  { id: 'campus_pro', name: 'Campus Pro', naira: 1750, drops: 50 },
  { id: 'semester', name: 'Semester', naira: 3000, drops: 100, badge: 'Most Drops' },
];

export const FIRST_PURCHASE_DISCOUNT_PERCENTAGE = 0.15;
