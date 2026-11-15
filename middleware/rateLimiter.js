/**
 * Lightweight in-memory rate limiter middleware
 * Protects AI generation and refinement endpoints from abuse.
 */

const requestTracker = new Map();

/**
 * Creates a rate limiter middleware
 * @param {number} maxRequests Max allowed requests in the time window
 * @param {number} windowMs Time window in milliseconds (default: 10 minutes)
 */
export const rateLimiter = (maxRequests = 5, windowMs = 10 * 60 * 1000) => {
  // Periodically clean up expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestTracker.entries()) {
      if (now - record.startTime > windowMs) {
        requestTracker.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    // Identify by User ID or IP address
    const identifier = req.user?.id || req.user?._id || req.ip || "unknown";
    const now = Date.now();

    const record = requestTracker.get(identifier);

    if (!record) {
      requestTracker.set(identifier, {
        count: 1,
        startTime: now,
      });
      return next();
    }

    // If window expired, reset
    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
      return next();
    }

    // Within window
    if (record.count >= maxRequests) {
      const remainingSeconds = Math.ceil((windowMs - (now - record.startTime)) / 1000);
      return res.status(429).json({
        error: `Rate limit reached. Please wait ${remainingSeconds} seconds before requesting again.`,
        retryAfter: remainingSeconds,
      });
    }

    record.count += 1;
    next();
  };
};
