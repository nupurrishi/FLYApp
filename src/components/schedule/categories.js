export const CATEGORIES = [
  { value: "call_time", label: "Call Time" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "fitting", label: "Fitting" },
  { value: "hair_makeup", label: "Hair & Makeup" },
  { value: "wardrobe", label: "Wardrobe" },
  { value: "runway", label: "Runway Segment" },
  { value: "break", label: "Break" },
  { value: "meeting", label: "Production Meeting" },
  { value: "other", label: "Other Event Activity" },
];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label || "Other Event Activity";

export const STATUSES = ["upcoming", "in_progress", "completed", "cancelled"];