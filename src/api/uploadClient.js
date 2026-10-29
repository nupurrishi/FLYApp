export async function uploadImage(file, eventId) {
  const form = new FormData();
  form.set("file", file);
  if (eventId) form.set("event_id", eventId);
  const response = await fetch("/api/uploads", { method: "POST", body: form, credentials: "same-origin" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Image upload failed");
  return result.file_url;
}
