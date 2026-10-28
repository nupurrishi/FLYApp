// Date/time helpers. Times are stored as structured date + 24h time strings and
// interpreted in the event's own time zone.

export const formatTime = (hhmm) => {
  if (!hhmm) return "";
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${(mRaw || "00").padStart(2, "0")} ${suffix}`;
};

export const formatTimeRange = (start, end) =>
  start && end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);

export const formatDay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

export const formatLongDay = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatRange = (start, end) => {
  if (!start) return "";
  if (!end || end === start) return formatLongDay(start);
  return `${formatLongDay(start)} — ${formatLongDay(end)}`;
};

// Friendly label for the stored IANA zone (the zone used for times is unchanged).
const ZONE_LABELS = {
  "America/Chicago": "Dallas, TX",
};

export const zoneLabel = (timeZone) =>
  ZONE_LABELS[timeZone] || (timeZone || "").replace(/_/g, " ");

// "YYYY-MM-DDTHH:mm" in the given time zone.
export const localStamp = (date = new Date(), timeZone = "America/Chicago") => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (t) => parts.find((p) => p.type === t)?.value || "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
};

export const itemStamp = (item) => `${item.date || ""}T${item.start_time || "00:00"}`;

export const isPast = (item) =>
  itemStamp(item) < localStamp(new Date(), item.timezone || "America/Chicago");

export const relativeTime = (iso) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T12:00:00`).getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / 86400000);
};