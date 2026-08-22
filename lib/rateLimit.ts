import { NextRequest } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// In-memory store for rate limiting
// Note: In a multi-region deployment or serverless environment, this is isolated per Vercel edge/lambda instance.
// For true global rate limiting across all instances, Redis (e.g., Upstash) should be used.
const ipCache = new Map<string, RateLimitEntry>();

export function checkRateLimit(req: NextRequest, limit: number, windowMs: number): { success: boolean, ip: string } {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  
  const entry = ipCache.get(ip);
  
  if (!entry || entry.resetAt < now) {
    // First request or window expired
    ipCache.set(ip, {
      count: 1,
      resetAt: now + windowMs
    });
    return { success: true, ip };
  }
  
  if (entry.count >= limit) {
    return { success: false, ip };
  }
  
  // Increment count
  entry.count += 1;
  ipCache.set(ip, entry);
  
  return { success: true, ip };
}

// Memory cleanup utility to prevent memory leaks in long-running instances
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipCache.entries()) {
      if (entry.resetAt < now) {
        ipCache.delete(ip);
      }
    }
  }, 60 * 1000); // Clean up every minute
}
