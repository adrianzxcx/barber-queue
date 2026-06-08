/**
 * rate-limit.ts
 *
 * A lightweight in-memory rate limiter for server-side use in Next.js.
 * Tracks failed login attempts per IP. After MAX_ATTEMPTS failures within
 * WINDOW_MS, subsequent attempts are blocked for LOCKOUT_MS.
 *
 * Note: Uses module-level state, so it resets on server restarts.
 * For production at scale, replace with a Redis-backed implementation.
 */

const MAX_ATTEMPTS = 10;          // max failed attempts before lockout
const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const LOCKOUT_MS = 15 * 60 * 1000; // 15-minute lockout period

interface AttemptRecord {
  count: number;
  windowStart: number;
  lockedUntil: number | null;
}

// Module-level store — shared across all requests in this process
const store = new Map<string, AttemptRecord>();

/**
 * Call this on a FAILED login attempt.
 * Returns the updated record (so the caller can read remaining attempts / lockout expiry).
 */
export function recordFailedAttempt(ip: string): AttemptRecord {
  const now = Date.now();
  const existing = store.get(ip);

  if (!existing) {
    const record: AttemptRecord = { count: 1, windowStart: now, lockedUntil: null };
    store.set(ip, record);
    return record;
  }

  // If the current window has expired, start a fresh one
  const windowExpired = now - existing.windowStart > WINDOW_MS;
  if (windowExpired) {
    const record: AttemptRecord = { count: 1, windowStart: now, lockedUntil: null };
    store.set(ip, record);
    return record;
  }

  existing.count += 1;

  // Trigger lockout once the threshold is hit
  if (existing.count >= MAX_ATTEMPTS) {
    existing.lockedUntil = now + LOCKOUT_MS;
  }

  store.set(ip, existing);
  return existing;
}

/**
 * Call this to check whether an IP is currently rate-limited BEFORE processing a login attempt.
 * Returns `{ blocked: false }` when the request may proceed,
 * or `{ blocked: true, retryAfterMs: number }` when the IP is locked out.
 */
export function checkRateLimit(ip: string): { blocked: false } | { blocked: true; retryAfterMs: number; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = store.get(ip);

  if (!existing) return { blocked: false };

  // If there is an active lockout
  if (existing.lockedUntil && now < existing.lockedUntil) {
    const retryAfterMs = existing.lockedUntil - now;
    return { blocked: true, retryAfterMs, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  // Lockout has expired — clear the record
  if (existing.lockedUntil && now >= existing.lockedUntil) {
    store.delete(ip);
  }

  return { blocked: false };
}

/**
 * Returns how many attempts remain before a lockout, or 0 if already locked.
 */
export function remainingAttempts(ip: string): number {
  const now = Date.now();
  const existing = store.get(ip);

  if (!existing) return MAX_ATTEMPTS;

  // Window expired — full attempts remain
  if (now - existing.windowStart > WINDOW_MS) return MAX_ATTEMPTS;

  return Math.max(0, MAX_ATTEMPTS - existing.count);
}

/**
 * Call this on a SUCCESSFUL login to clear the counter for this IP.
 */
export function clearAttempts(ip: string): void {
  store.delete(ip);
}

export { MAX_ATTEMPTS, LOCKOUT_MS, WINDOW_MS };
