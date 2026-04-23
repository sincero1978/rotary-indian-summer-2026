import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const MENUS: Record<string, string> = {
  "1": "Menu 1 — Wiener Schnitzel",
  "2": "Menu 2 — Cannelloni Bolognese",
  "3": "Menu 3 — Vegetarian Cannelloni",
};

const SENDER = '"Rotary Indian Summer Tour 2026" <rotarybascharagekordall@gmail.com>';
const ORGANISER_RECIPIENTS = ["Rist2026@hotmail.com", "rotarybascharagekordall@gmail.com"];

const BANK_IBAN = "LU80 0019 4955 0049 5000";
const BANK_BIC = "BGLLLULL";
const BANK_NAME = "BGL BNP Paribas";
const ACCOUNT_NAME = "Rotary Club Bascharage-Kordall";

function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `RIST-2026-${suffix}`;
}

interface MealChoice {
  include: boolean;
  menu: string;
}

interface RegistrationPayload {
  driverName: string;
  copilotName: string;
  email: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
  extraParticipants: number;
  extraNames: string[];
  mealChoices: MealChoice[];
  mealCost: number;
  total: number;
}

// ─── Organiser email (full registration details) ──────────────────────────────

function buildOrganiserHtml(data: RegistrationPayload, ref: string): string {
  const participants = [data.driverName, data.copilotName, ...data.extraNames];
  const extraPersonCost = data.extraParticipants * 20;

  const mealRows = data.mealChoices
    .map(
      (m, i) => `
      <tr style="background:${i % 2 === 0 ? "#f0f7f4" : "white"}">
        <td style="padding:8px 12px;color:#555">${participants[i] ?? `Person ${i + 1}`}</td>
        <td style="padding:8px 12px">${m.include ? MENUS[m.menu] ?? m.menu : "No meal"}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>RIST 2026 Registration</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">

        <tr><td style="background:#2D6A4F;padding:32px;text-align:center">
          <h1 style="color:white;margin:0 0 6px;font-size:22px">Rotary Indian Summer Tour 2026</h1>
          <p style="color:#52B788;margin:0;font-size:14px;letter-spacing:0.1em;text-transform:uppercase">New Registration</p>
        </td></tr>

        <tr><td style="background:#52B788;padding:12px 32px;text-align:center">
          <p style="margin:0;color:#1a2e24;font-size:13px;font-weight:bold;letter-spacing:0.12em">REFERENCE: ${ref}</p>
        </td></tr>

        <tr><td style="padding:32px">

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">Team Information</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555;width:40%">Driver</td>
              <td style="padding:8px 12px;font-weight:bold">${data.driverName}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">Co-pilot</td>
              <td style="padding:8px 12px;font-weight:bold">${data.copilotName}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">Email</td>
              <td style="padding:8px 12px">${data.email}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">Phone</td>
              <td style="padding:8px 12px">${data.phone}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">Vehicle</td>
              <td style="padding:8px 12px">${data.carMake} ${data.carModel} — ${data.carYear}</td>
            </tr>
            ${data.extraParticipants > 0 ? `<tr>
              <td style="padding:8px 12px;color:#555">Extra participant(s)</td>
              <td style="padding:8px 12px">${data.extraNames.join(", ")}</td>
            </tr>` : ""}
          </table>

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">Meal Selections</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#2D6A4F">
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">Participant</th>
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">Selection</th>
            </tr>
            ${mealRows}
          </table>

          <div style="background:#f0f7f4;border-left:4px solid #2D6A4F;padding:20px;margin-bottom:24px;border-radius:4px">
            <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px">Price Breakdown</h3>
            <p style="margin:4px 0;color:#555;font-size:14px">Team entry (2 persons): <strong>€125</strong></p>
            ${data.extraParticipants > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">Extra participant(s) (${data.extraParticipants} × €20): <strong>€${extraPersonCost}</strong></p>` : ""}
            ${data.mealCost > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">Meals (${data.mealChoices.filter((m) => m.include).length} × €35): <strong>€${data.mealCost}</strong></p>` : ""}
            <p style="margin:16px 0 0;font-size:20px;font-weight:bold;color:#2D6A4F">Total: €${data.total}</p>
          </div>

          <div style="border:1px solid #e2ede8;border-radius:6px;padding:16px;font-size:13px;color:#555;line-height:1.8">
            <strong style="color:#2D6A4F">📅</strong> Sunday, 6 September 2026<br>
            <strong style="color:#2D6A4F">⏰</strong> Start: 10h00 — Briefing: 10h45<br>
            <strong style="color:#2D6A4F">📍</strong> Mess-Café / Reckange-sur-Mess
          </div>

        </td></tr>

        <tr><td style="background:#1a2e24;padding:20px;text-align:center">
          <p style="color:#52B788;margin:0;font-size:12px">Rotary Club Bascharage-Kordall — Service Above Self</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Driver confirmation email ────────────────────────────────────────────────

function buildDriverHtml(data: RegistrationPayload, ref: string): string {
  const participants = [data.driverName, data.copilotName, ...data.extraNames];
  const extraPersonCost = data.extraParticipants * 20;
  const paymentRef = `Rotary Indian Summer ${ref}`;

  const mealRows = data.mealChoices
    .map(
      (m, i) => `
      <tr style="background:${i % 2 === 0 ? "#f0f7f4" : "white"}">
        <td style="padding:8px 12px;color:#555">${participants[i] ?? `Person ${i + 1}`}</td>
        <td style="padding:8px 12px">${m.include ? MENUS[m.menu] ?? m.menu : "No meal"}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>RIST 2026 — Registration Confirmed</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">

        <tr><td style="background:#2D6A4F;padding:40px 32px;text-align:center">
          <h1 style="color:white;margin:0 0 8px;font-size:24px">Rotary Indian Summer Tour 2026</h1>
          <p style="color:#52B788;margin:0;font-size:14px;letter-spacing:0.1em;text-transform:uppercase">Registration Confirmed</p>
        </td></tr>

        <tr><td style="background:#52B788;padding:12px 32px;text-align:center">
          <p style="margin:0;color:#1a2e24;font-size:13px;font-weight:bold;letter-spacing:0.12em">REFERENCE: ${ref}</p>
        </td></tr>

        <tr><td style="padding:32px">

          <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 24px">
            Dear ${data.driverName},<br><br>
            Thank you for registering for the <strong>9th Rotary Indian Summer Tour 2026</strong>.
            We are delighted to welcome you and your team to this year's charity rally.
            Your registration has been received and is summarised below.
          </p>

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">Your Registration</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555;width:40%">Driver</td>
              <td style="padding:8px 12px;font-weight:bold">${data.driverName}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">Co-pilot</td>
              <td style="padding:8px 12px;font-weight:bold">${data.copilotName}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">Email</td>
              <td style="padding:8px 12px">${data.email}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">Phone</td>
              <td style="padding:8px 12px">${data.phone}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">Vehicle</td>
              <td style="padding:8px 12px">${data.carMake} ${data.carModel} — ${data.carYear}</td>
            </tr>
            ${data.extraParticipants > 0 ? `<tr>
              <td style="padding:8px 12px;color:#555">Extra participant(s)</td>
              <td style="padding:8px 12px">${data.extraNames.join(", ")}</td>
            </tr>` : ""}
          </table>

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">Meal Selections</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#2D6A4F">
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">Participant</th>
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">Selection</th>
            </tr>
            ${mealRows}
          </table>

          <div style="background:#f0f7f4;border-left:4px solid #2D6A4F;padding:20px;margin-bottom:24px;border-radius:4px">
            <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px">Price Summary</h3>
            <p style="margin:4px 0;color:#555;font-size:14px">Team entry (2 persons): <strong>€125</strong></p>
            ${data.extraParticipants > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">Extra participant(s) (${data.extraParticipants} × €20): <strong>€${extraPersonCost}</strong></p>` : ""}
            ${data.mealCost > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">Meals (${data.mealChoices.filter((m) => m.include).length} × €35): <strong>€${data.mealCost}</strong></p>` : ""}
            <p style="margin:16px 0 0;font-size:20px;font-weight:bold;color:#2D6A4F">Total due: €${data.total}</p>
          </div>

          <!-- Payment instructions -->
          <div style="background:#e8f4ee;border:1px solid #52B788;border-radius:6px;padding:20px;margin-bottom:24px">
            <h3 style="color:#2D6A4F;margin:0 0 16px;font-size:15px">Payment Instructions</h3>
            <p style="margin:0 0 12px;color:#555;font-size:14px;line-height:1.6">
              Please transfer the amount of <strong>€${data.total}</strong> by bank transfer to the following account:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
              <tr style="background:#d4ecdf">
                <td style="padding:8px 12px;color:#555;width:40%;font-size:14px">Account Name</td>
                <td style="padding:8px 12px;font-weight:bold;font-size:14px">${ACCOUNT_NAME}</td>
              </tr>
              <tr style="background:white">
                <td style="padding:8px 12px;color:#555;font-size:14px">Bank</td>
                <td style="padding:8px 12px;font-weight:bold;font-size:14px">${BANK_NAME}</td>
              </tr>
              <tr style="background:#d4ecdf">
                <td style="padding:8px 12px;color:#555;font-size:14px">IBAN</td>
                <td style="padding:8px 12px;font-weight:bold;font-size:14px;font-family:monospace">${BANK_IBAN}</td>
              </tr>
              <tr style="background:white">
                <td style="padding:8px 12px;color:#555;font-size:14px">BIC / SWIFT</td>
                <td style="padding:8px 12px;font-weight:bold;font-size:14px;font-family:monospace">${BANK_BIC}</td>
              </tr>
            </table>
            <div style="background:#2D6A4F;border-radius:4px;padding:14px 16px">
              <p style="margin:0 0 4px;color:#52B788;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;font-weight:bold">Payment Communication (mandatory)</p>
              <p style="margin:0;color:white;font-size:15px;font-weight:bold;font-family:monospace">${paymentRef}</p>
            </div>
            <p style="margin:12px 0 0;color:#555;font-size:13px;line-height:1.6">
              ⚠️ Please include the exact communication above in your bank transfer so we can identify your payment.
              Your place will be confirmed once payment is received. SEPA transfers typically process within 1–3 banking days.
            </p>
          </div>

          <!-- Event details -->
          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">Event Details</h3>
          <div style="border:1px solid #e2ede8;border-radius:6px;padding:16px;font-size:14px;color:#555;line-height:2">
            <strong style="color:#2D6A4F">📅</strong> Sunday, 6 September 2026<br>
            <strong style="color:#2D6A4F">⏰</strong> Start: 10h00 — Briefing: 10h45<br>
            <strong style="color:#2D6A4F">📍</strong> Mess-Café / Reckange-sur-Mess<br>
            <strong style="color:#2D6A4F">🗺</strong> Route book with arrows provided on the day (no average speed to maintain)
          </div>

          <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.7">
            If you have any questions, please don't hesitate to contact us by replying to this email.<br>
            We look forward to seeing you on the road!
          </p>

        </td></tr>

        <tr><td style="background:#1a2e24;padding:20px;text-align:center">
          <p style="color:#52B788;margin:0 0 4px;font-size:12px">Rotary Club Bascharage-Kordall — Service Above Self</p>
          <p style="color:#52B788;margin:0;font-size:11px;opacity:0.7">rotarybascharagekordall@gmail.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: RegistrationPayload = await req.json();

    if (
      !body.driverName?.trim() ||
      !body.copilotName?.trim() ||
      !body.email?.trim() ||
      !body.phone?.trim() ||
      !body.carMake?.trim() ||
      !body.carModel?.trim() ||
      !body.carYear?.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reference = generateReference();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const encodeSubject = (subject: string) =>
      `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;

    const buildRaw = (to: string | string[], subject: string, html: string, replyTo?: string) => {
      const toHeader = Array.isArray(to) ? to.join(", ") : to;
      const headers = [
        `From: ${SENDER}`,
        `To: ${toHeader}`,
        ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
        `Subject: ${encodeSubject(subject)}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        html,
      ].join("\n");
      return Buffer.from(headers).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };

    // Email 1: full registration details to organisers
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: buildRaw(
          ORGANISER_RECIPIENTS,
          `[Rotary Indian Summer Rally] Registration ${reference} - ${body.driverName} & ${body.copilotName}`,
          buildOrganiserHtml(body, reference),
          body.email
        ),
      },
    });

    // Email 2: confirmation + payment instructions to driver
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: buildRaw(
          body.email,
          `[Rotary Indian Summer Rally] Registration Confirmed - ${body.driverName} & ${body.copilotName}`,
          buildDriverHtml(body, reference)
        ),
      },
    });

    return NextResponse.json({ reference });
  } catch (err) {
    console.error("Registration error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
