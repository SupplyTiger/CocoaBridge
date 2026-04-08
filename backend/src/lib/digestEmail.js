import { Resend } from "resend";
import crypto from "crypto";
import { ENV } from "../config/env.js";

const resend = new Resend(ENV.RESEND_API_KEY);

export function buildUnsubscribeToken(userId) {
  return crypto
    .createHmac("sha256", ENV.DIGEST_HMAC_SECRET)
    .update(userId)
    .digest("hex");
}

export function buildUnsubscribeUrl(userId) {
  const token = buildUnsubscribeToken(userId);
  return `${ENV.CLIENT_URL}/api/digest/unsubscribe?userId=${userId}&token=${token}`;
}

export function buildEmailHtml({ user, data, narrative, dateLabel }) {
  const appUrl = ENV.CLIENT_URL ?? "";
  const unsubUrl = buildUnsubscribeUrl(user.id);
  const { topOpps = [], weeklyMetrics, upcomingDeadlines = [] } = data;

  const greeting = user.name ? `Hi ${user.name.split(" ")[0]},` : "Hi,";

  // ── Narrative section ──────────────────────────────────────────────────────
  const narrativeHtml = narrative
    ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${narrative}</p>`
    : `<p style="margin:0 0 24px;font-size:14px;color:#9ca3af;font-style:italic;">Narrative unavailable today.</p>`;

  // ── Weekly metrics section ─────────────────────────────────────────────────
  const metricsHtml = weeklyMetrics
    ? (() => {
        const m = weeklyMetrics;
        const metrics = [
          { label: "New Contacts", value: m.newContacts ?? "—" },
          { label: "Outreaches", value: m.outreaches ?? "—" },
          { label: "Follow-ups", value: m.followUps ?? "—" },
          { label: "Screened Solics.", value: m.screenedSolicitations ?? "—" },
          { label: "Buyer Paths", value: m.buyerPaths ?? "—" },
        ];
        const cells = metrics
          .map(
            ({ label, value }) => `
          <td style="text-align:center;padding:12px 8px;border-right:1px solid #e5e7eb;">
            <div style="font-size:22px;font-weight:700;color:#111827;">${value}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
          </td>`
          )
          .join("");
        return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;overflow:hidden;">
          <tr>${cells}</tr>
        </table>
        <div style="text-align:right;margin-top:8px;">
          <a href="${appUrl}/metrics" style="font-size:12px;color:#6366f1;text-decoration:none;">View full metrics →</a>
        </div>`;
      })()
    : `<p style="font-size:14px;color:#9ca3af;font-style:italic;">Metrics unavailable today.</p>`;

  // ── Top opportunities section ──────────────────────────────────────────────
  const oppsHtml =
    topOpps.length > 0
      ? topOpps
          .map(
            (opp) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <a href="${appUrl}/opportunities/${opp.id}" style="font-size:14px;font-weight:600;color:#111827;text-decoration:none;">${opp.title ?? "Untitled"}</a>
            <div style="margin-top:3px;">
              ${opp.pscCode ? `<span style="display:inline-block;font-size:11px;background:#f3f4f6;color:#374151;border-radius:4px;padding:1px 6px;margin-right:4px;">PSC ${opp.pscCode}</span>` : ""}
              ${opp.type ? `<span style="display:inline-block;font-size:11px;background:#f3f4f6;color:#374151;border-radius:4px;padding:1px 6px;">${opp.type.replace(/_/g, " ")}</span>` : ""}
            </div>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td style="padding:10px 0;font-size:14px;color:#9ca3af;font-style:italic;">No opportunities today.</td></tr>`;

  // ── Upcoming deadlines section ─────────────────────────────────────────────
  const deadlinesHtml =
    upcomingDeadlines.length > 0
      ? upcomingDeadlines
          .map((item) => {
            const daysOut = Math.ceil(
              (new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const urgentColor = daysOut <= 2 ? "#dc2626" : daysOut <= 4 ? "#d97706" : "#16a34a";
            return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
              <a href="${appUrl}/inbox/${item.id}" style="font-size:14px;font-weight:600;color:#111827;text-decoration:none;">${item.title ?? "Untitled"}</a>
              <div style="margin-top:3px;">
                <span style="font-size:12px;color:${urgentColor};font-weight:600;">Due in ${daysOut}d — ${new Date(item.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span style="margin-left:8px;font-size:11px;background:#f3f4f6;color:#374151;border-radius:4px;padding:1px 6px;">${item.reviewStatus}</span>
              </div>
            </td>
          </tr>`;
          })
          .join("")
      : `<tr><td style="padding:10px 0;font-size:14px;color:#9ca3af;font-style:italic;">No deadlines in the next 7 days.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>CocoaBridge Daily Digest — ${dateLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#111827;border-radius:10px 10px 0 0;padding:24px 32px;">
              <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">CocoaBridge</div>
              <div style="font-size:13px;color:#9ca3af;margin-top:2px;">Daily Digest · ${dateLabel}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;">

              <p style="margin:0 0 20px;font-size:15px;color:#111827;">${greeting}</p>

              ${narrativeHtml}

              <!-- Weekly Metrics -->
              <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">This Week's Metrics</h2>
              <div style="margin-bottom:28px;">${metricsHtml}</div>

              <!-- Top Opportunities -->
              <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Top Opportunities</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${oppsHtml}
              </table>

              <!-- Upcoming Deadlines -->
              <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Deadlines This Week</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                ${deadlinesHtml}
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;border-radius:0 0 10px 10px;padding:20px 32px;text-align:center;">
              <a href="${appUrl}" style="display:inline-block;margin-bottom:12px;font-size:13px;font-weight:600;color:#6366f1;text-decoration:none;">Open CocoaBridge →</a>
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                You're receiving this because digest emails are enabled for your account.<br/>
                <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendDigestEmail({ user, data, narrative, dateLabel }) {
  const html = buildEmailHtml({ user, data, narrative, dateLabel });
  const to = process.env.RESEND_TEST_TO ?? user.email;
  await resend.emails.send({
    from: ENV.RESEND_FROM,
    to,
    subject: `CocoaBridge Daily Digest — ${dateLabel}`,
    html,
  });
}
