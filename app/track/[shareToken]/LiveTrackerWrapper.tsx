"use client";

import dynamic from 'next/dynamic';

const LiveTracker = dynamic(() => import('@/components/dashboard/LiveTracker'), { ssr: false });

export function LiveTrackerWrapper({ trip }: { trip: any }) {
  return <LiveTracker trip={trip} />;
}
