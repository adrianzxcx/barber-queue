export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
}

export function formatDuration(durationMinutes: number) {
  return `${durationMinutes} mins`;
}

export function formatWait(minutes: number) {
  if (minutes <= 0) return "Immediate";
  return `${minutes} mins`;
}

export function clampProgressFromQueuePosition(peopleAhead: number) {
  if (peopleAhead <= 0) return 85;
  return Math.max(10, Math.min(80, 80 - peopleAhead * 12));
}
