import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createResetToken } from "@/lib/admin-config";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: max 5 reset requests per IP per hour
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (await isRateLimited(`forgot:${ip}`, 5, 60 * 60)) {
    // Return 200 to avoid leaking whether the IP is blocked (enumeration prevention)
    return NextResponse.json({ ok: true });
  }

  try {
    const { email } = await req.json();
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const token = await createResetToken();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/admin/reset-password?token=${token}`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const subject = "=?UTF-8?B?" + Buffer.from("RIST 2026 — Staff Portal Password Reset").toString("base64") + "?=";
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Password Reset</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <tr><td style="background:#2D6A4F;padding:28px 32px;text-align:center">
          <h1 style="color:white;margin:0 0 4px;font-size:20px">Rotary Indian Summer Tour 2026</h1>
          <p style="color:#52B788;margin:0;font-size:13px;letter-spacing:0.1em;text-transform:uppercase">Staff Portal</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#2D6A4F;font-size:18px;margin:0 0 16px">Password Reset Request</h2>
          <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px">
            A password reset was requested for the Staff Portal. Click the button below to set a new password.
            This link is valid for <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin:0 0 28px">
            <a href="${resetUrl}" style="display:inline-block;background:#2D6A4F;color:white;text-decoration:none;padding:13px 32px;border-radius:50px;font-size:14px;font-weight:600;letter-spacing:0.05em">
              Reset Password
            </a>
          </div>
          <p style="color:#888;font-size:12px;line-height:1.7;margin:0">
            If you did not request a password reset, you can safely ignore this email.<br>
            This link will expire in 1 hour.
          </p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
          <p style="color:#aaa;font-size:11px;margin:0">
            Or copy this link: <a href="${resetUrl}" style="color:#2D6A4F;word-break:break-all">${resetUrl}</a>
          </p>
        </td></tr>
        <tr><td style="background:#1a2e24;padding:16px;text-align:center">
          <p style="color:#52B788;margin:0;font-size:11px">Rotary Club Bascharage-Kordall — Am Déngscht vun deenen aneren</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const raw = Buffer.from(
      [
        `From: "Rotary Indian Summer Tour 2026" <rotarybascharagekordall@gmail.com>`,
        `To: ${email}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        html,
      ].join("\n")
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
