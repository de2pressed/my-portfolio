/**
 * In-memory rate limiting for API routes
 * For production, consider using Redis or a similar distributed cache
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; resetTime: number; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // New window or expired
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { success: true, resetTime, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, resetTime: entry.resetTime, remaining: 0 };
  }

  entry.count++;
  return { success: true, resetTime: entry.resetTime, remaining: limit - entry.count };
}

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
