import nodemailer from "nodemailer";

let transport;

function getTransport() {
  if (transport) return transport;
  if (process.env.SMTP_URL) {
    transport = nodemailer.createTransport(process.env.SMTP_URL);
  } else if (process.env.SMTP_HOST && process.env.SMTP_FROM) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  } else {
    throw new Error("SMTP_URL or SMTP_HOST and SMTP_FROM must be configured to send account emails");
  }
  return transport;
}

export async function sendAccountEmail({ to, subject, url, intro }) {
  const from = process.env.SMTP_FROM;
  if (!from) throw new Error("SMTP_FROM must be configured to send account emails");
  const safeUrl = String(url).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  await getTransport().sendMail({
    from,
    to,
    subject,
    text: `${intro}\n\n${url}\n\nIf you did not request this, you can ignore this message.`,
    html: `<p>${intro}</p><p><a href="${safeUrl}">Continue to FLYApp</a></p><p>If you did not request this, you can ignore this message.</p>`,
  });
}
