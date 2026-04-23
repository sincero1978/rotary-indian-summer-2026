import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const SENDER = '"Rotary Indian Summer Tour 2026" <rotarybascharagekordall@gmail.com>';
const ORGANISER_RECIPIENTS = ["Rist2026@hotmail.com", "rotarybascharagekordall@gmail.com"];

const BANK_IBAN = "LU80 0019 4955 0049 5000";
const BANK_BIC = "BGLLLULL";
const BANK_NAME = "BGL BNP Paribas";
const ACCOUNT_NAME = "Rotary Club Bascharage-Kordall";

// ─── i18n strings for emails ──────────────────────────────────────────────────

const emailStrings = {
  en: {
    noMeal: "No meal",
    person: "Person",
    newRegistration: "New Registration",
    teamInfo: "Team Information",
    driver: "Driver",
    copilot: "Co-pilot",
    email: "Email",
    phone: "Phone",
    vehicle: "Vehicle",
    extraParticipants: "Extra participant(s)",
    mealSelections: "Meal Selections",
    participant: "Participant",
    selection: "Selection",
    priceBreakdown: "Price Breakdown",
    teamEntry: "Team entry (2 persons)",
    extraLine: (n: number, cost: number) => `Extra participant(s) (${n} × €20): <strong>€${cost}</strong>`,
    mealsLine: (n: number, cost: number) => `Meals (${n} × €35): <strong>€${cost}</strong>`,
    total: "Total",
    totalDue: "Total due",
    eventDetails: "Event Details",
    date: "Sunday, 6 September 2026",
    startBriefing: "Start: 10h00 — Briefing: 10h45",
    location: "Mess-Café / Reckange-sur-Mess",
    routebook: "Route book with arrows provided on the day (no average speed to maintain)",
    motto: "Service Above Self",
    // driver email
    registrationConfirmed: "Registration Confirmed",
    yourRegistration: "Your Registration",
    priceSummary: "Price Summary",
    greeting: (name: string) => `Dear ${name},`,
    intro: `Thank you for registering for the <strong>9th Rotary Indian Summer Tour 2026</strong>. We are delighted to welcome you and your team to this year's charity rally. Your registration has been received and is summarised below.`,
    paymentInstructions: "Payment Instructions",
    paymentIntro: (total: number) => `Please transfer the amount of <strong>€${total}</strong> by bank transfer to the following account:`,
    accountName: "Account Name",
    bank: "Bank",
    paymentCommLabel: "Payment Communication (mandatory)",
    paymentWarning: "⚠️ Please include the exact communication above in your bank transfer so we can identify your payment. Your place will be confirmed once payment is received. SEPA transfers typically process within 1–3 banking days.",
    closing: "If you have any questions, please don't hesitate to contact us by replying to this email.<br>We look forward to seeing you on the road!",
    subjectOrganiser: (ref: string, driver: string, copilot: string) => `[Rotary Indian Summer Rally] Registration ${ref} - ${driver} & ${copilot}`,
    subjectDriver: (driver: string, copilot: string) => `[Rotary Indian Summer Rally] Registration Confirmed - ${driver} & ${copilot}`,
  },
  fr: {
    noMeal: "Pas de repas",
    person: "Personne",
    newRegistration: "Nouvelle Inscription",
    teamInfo: "Informations de l'équipe",
    driver: "Pilote",
    copilot: "Copilote",
    email: "E-mail",
    phone: "Téléphone",
    vehicle: "Véhicule",
    extraParticipants: "Participant(s) supplémentaire(s)",
    mealSelections: "Choix des repas",
    participant: "Participant",
    selection: "Sélection",
    priceBreakdown: "Détail des prix",
    teamEntry: "Équipe (2 personnes)",
    extraLine: (n: number, cost: number) => `Participant(s) supplémentaire(s) (${n} × €20) : <strong>€${cost}</strong>`,
    mealsLine: (n: number, cost: number) => `Repas (${n} × €35) : <strong>€${cost}</strong>`,
    total: "Total",
    totalDue: "Total à payer",
    eventDetails: "Détails de l'événement",
    date: "Dimanche, 6 septembre 2026",
    startBriefing: "Départ : 10h00 — Briefing : 10h45",
    location: "Mess-Café / Reckange-sur-Mess",
    routebook: "Road-book avec flèches fourni le jour même (pas de vitesse moyenne à maintenir)",
    motto: "Au service des autres",
    registrationConfirmed: "Inscription Confirmée",
    yourRegistration: "Votre Inscription",
    priceSummary: "Récapitulatif des prix",
    greeting: (name: string) => `Cher(e) ${name},`,
    intro: `Merci de vous être inscrit(e) au <strong>9e Rotary Indian Summer Tour 2026</strong>. Nous sommes ravis de vous accueillir, vous et votre équipe, à ce rallye caritative. Votre inscription a bien été reçue et est résumée ci-dessous.`,
    paymentInstructions: "Instructions de paiement",
    paymentIntro: (total: number) => `Veuillez transférer le montant de <strong>€${total}</strong> par virement bancaire sur le compte suivant :`,
    accountName: "Nom du compte",
    bank: "Banque",
    paymentCommLabel: "Communication de paiement (obligatoire)",
    paymentWarning: "⚠️ Veuillez inclure la communication exacte ci-dessus dans votre virement bancaire afin que nous puissions identifier votre paiement. Votre place sera confirmée dès réception du paiement. Les virements SEPA sont généralement traités en 1 à 3 jours ouvrables.",
    closing: "Si vous avez des questions, n'hésitez pas à nous contacter en répondant à cet e-mail.<br>Nous avons hâte de vous retrouver sur la route !",
    subjectOrganiser: (ref: string, driver: string, copilot: string) => `[Rotary Indian Summer Rally] Inscription ${ref} - ${driver} & ${copilot}`,
    subjectDriver: (driver: string, copilot: string) => `[Rotary Indian Summer Rally] Inscription Confirmée - ${driver} & ${copilot}`,
  },

  lb: {
    noMeal: "Kee Iessen",
    person: "Persoun",
    newRegistration: "Nei Umeldung",
    teamInfo: "Teamsinformatiounen",
    driver: "Fuerer",
    copilot: "Copilot",
    email: "E-Mail",
    phone: "Telefon",
    vehicle: "Gefier",
    extraParticipants: "Zousätzlech Participate",
    mealSelections: "Iessensauswiel",
    participant: "Participant",
    selection: "Auswiel",
    priceBreakdown: "Präisopstellung",
    teamEntry: "Team-Umeldung (2 Persoune)",
    extraLine: (n: number, cost: number) => `Zousätzlech Participate (${n} × €20): <strong>€${cost}</strong>`,
    mealsLine: (n: number, cost: number) => `Iessen (${n} × €35): <strong>€${cost}</strong>`,
    total: "Total",
    totalDue: "Fälleg Total",
    eventDetails: "Evenementdetailer",
    date: "Sonndeg, 6. September 2026",
    startBriefing: "Start: 10h00 — Briefing: 10h45",
    location: "Mess-Café / Reckange-sur-Mess",
    routebook: "Roadbook mat Pfeil am Dag geliwwert (keng Duerchschnëttsgeschwindegkeet ze halen)",
    motto: "Déngscht iwwert sech selwer",
    registrationConfirmed: "Umeldung Confirméiert",
    yourRegistration: "Är Umeldung",
    priceSummary: "Präiszesummefaassung",
    greeting: (name: string) => `Léif ${name},`,
    intro: `Merci fir Är Umeldung fir den <strong>9. Rotary Indian Summer Tour 2026</strong>. Mir freeën eis Iech an Äert Team bei dësem Wohltätegkeetsrallye wëllkomm ze heeschen. Är Umeldung gouf kritt a gëtt hei ënnen zesummegefaasst.`,
    paymentInstructions: "Bezuelungsinstruktiounen",
    paymentIntro: (total: number) => `Schéckt w.e.g. de Betrag vun <strong>€${total}</strong> duerch Banküberweisung op dat folgend Konto:`,
    accountName: "Kontonumm",
    bank: "Bank",
    paymentCommLabel: "Bezuelungsmitteilung (obligatoresch)",
    paymentWarning: "⚠️ Schreiwt w.e.g. d'exakt Kommunikatioun uewen an Ärer Überweisung, fir datt mir Är Bezuelung identifizéieren kënnen. Äre Plaz gëtt bestätegt wann d'Bezuelung kritt gouf. SEPA-Überweisunge gi meeschtens bannent 1–3 Bankdagen verarbeecht.",
    closing: "Wann Dir Froen hutt, zéckt w.e.g. net, eis duerch Äntwerten op dës E-Mail ze kontaktéieren.<br>Mir freeën eis Iech op der Streck ze gesinn!",
    subjectOrganiser: (ref: string, driver: string, copilot: string) => `[Rotary Indian Summer Rally] Umeldung ${ref} - ${driver} & ${copilot}`,
    subjectDriver: (driver: string, copilot: string) => `[Rotary Indian Summer Rally] Umeldung Confirméiert - ${driver} & ${copilot}`,
  },
};

const MENUS: Record<string, Record<string, string>> = {
  en: {
    "1": "Menu 1 — Wiener Schnitzel",
    "2": "Menu 2 — Cannelloni Bolognese",
    "3": "Menu 3 — Vegetarian Cannelloni",
  },
  fr: {
    "1": "Menu 1 — Wiener Schnitzel",
    "2": "Menu 2 — Cannelloni Bolognaise",
    "3": "Menu 3 — Cannelloni Végétarien",
  },
  lb: {
    "1": "Menu 1 — Wiener Schnitzel",
    "2": "Menu 2 — Cannelloni Bolognese",
    "3": "Menu 3 — Vegetaresche Cannelloni",
  },
};

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
  lang?: string;
}

// ─── Organiser email ──────────────────────────────────────────────────────────

function buildOrganiserHtml(data: RegistrationPayload, ref: string, lang: "en" | "fr" | "lb"): string {
  const s = emailStrings[lang];
  const menus = MENUS[lang];
  const participants = [data.driverName, data.copilotName, ...data.extraNames];
  const extraPersonCost = data.extraParticipants * 20;

  const mealRows = data.mealChoices.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? "#f0f7f4" : "white"}">
      <td style="padding:8px 12px;color:#555">${participants[i] ?? `${s.person} ${i + 1}`}</td>
      <td style="padding:8px 12px">${m.include ? menus[m.menu] ?? m.menu : s.noMeal}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><title>RIST 2026</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">

        <tr><td style="background:#2D6A4F;padding:32px;text-align:center">
          <h1 style="color:white;margin:0 0 6px;font-size:22px">Rotary Indian Summer Tour 2026</h1>
          <p style="color:#52B788;margin:0;font-size:14px;letter-spacing:0.1em;text-transform:uppercase">${s.newRegistration}</p>
        </td></tr>

        <tr><td style="background:#52B788;padding:12px 32px;text-align:center">
          <p style="margin:0;color:#1a2e24;font-size:13px;font-weight:bold;letter-spacing:0.12em">REFERENCE: ${ref}</p>
        </td></tr>

        <tr><td style="padding:32px">

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">${s.teamInfo}</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555;width:40%">${s.driver}</td>
              <td style="padding:8px 12px;font-weight:bold">${data.driverName}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">${s.copilot}</td>
              <td style="padding:8px 12px;font-weight:bold">${data.copilotName}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">${s.email}</td>
              <td style="padding:8px 12px">${data.email}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">${s.phone}</td>
              <td style="padding:8px 12px">${data.phone}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">${s.vehicle}</td>
              <td style="padding:8px 12px">${data.carMake} ${data.carModel} — ${data.carYear}</td>
            </tr>
            ${data.extraParticipants > 0 ? `<tr>
              <td style="padding:8px 12px;color:#555">${s.extraParticipants}</td>
              <td style="padding:8px 12px">${data.extraNames.join(", ")}</td>
            </tr>` : ""}
          </table>

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">${s.mealSelections}</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#2D6A4F">
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">${s.participant}</th>
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">${s.selection}</th>
            </tr>
            ${mealRows}
          </table>

          <div style="background:#f0f7f4;border-left:4px solid #2D6A4F;padding:20px;margin-bottom:24px;border-radius:4px">
            <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px">${s.priceBreakdown}</h3>
            <p style="margin:4px 0;color:#555;font-size:14px">${s.teamEntry}: <strong>€125</strong></p>
            ${data.extraParticipants > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">${s.extraLine(data.extraParticipants, extraPersonCost)}</p>` : ""}
            ${data.mealCost > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">${s.mealsLine(data.mealChoices.filter((m) => m.include).length, data.mealCost)}</p>` : ""}
            <p style="margin:16px 0 0;font-size:20px;font-weight:bold;color:#2D6A4F">${s.total}: €${data.total}</p>
          </div>

          <div style="border:1px solid #e2ede8;border-radius:6px;padding:16px;font-size:13px;color:#555;line-height:1.8">
            <strong style="color:#2D6A4F">📅</strong> ${s.date}<br>
            <strong style="color:#2D6A4F">⏰</strong> ${s.startBriefing}<br>
            <strong style="color:#2D6A4F">📍</strong> ${s.location}
          </div>

        </td></tr>

        <tr><td style="background:#1a2e24;padding:20px;text-align:center">
          <p style="color:#52B788;margin:0;font-size:12px">Rotary Club Bascharage-Kordall — ${s.motto}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Driver confirmation email ────────────────────────────────────────────────

function buildDriverHtml(data: RegistrationPayload, ref: string, lang: "en" | "fr" | "lb"): string {
  const s = emailStrings[lang];
  const menus = MENUS[lang];
  const participants = [data.driverName, data.copilotName, ...data.extraNames];
  const extraPersonCost = data.extraParticipants * 20;
  const paymentRef = `Rotary Indian Summer ${ref}`;

  const mealRows = data.mealChoices.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? "#f0f7f4" : "white"}">
      <td style="padding:8px 12px;color:#555">${participants[i] ?? `${s.person} ${i + 1}`}</td>
      <td style="padding:8px 12px">${m.include ? menus[m.menu] ?? m.menu : s.noMeal}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"><title>RIST 2026</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">

        <tr><td style="background:#2D6A4F;padding:40px 32px;text-align:center">
          <h1 style="color:white;margin:0 0 8px;font-size:24px">Rotary Indian Summer Tour 2026</h1>
          <p style="color:#52B788;margin:0;font-size:14px;letter-spacing:0.1em;text-transform:uppercase">${s.registrationConfirmed}</p>
        </td></tr>

        <tr><td style="background:#52B788;padding:12px 32px;text-align:center">
          <p style="margin:0;color:#1a2e24;font-size:13px;font-weight:bold;letter-spacing:0.12em">REFERENCE: ${ref}</p>
        </td></tr>

        <tr><td style="padding:32px">

          <p style="color:#333;font-size:15px;line-height:1.7;margin:0 0 24px">
            ${s.greeting(data.driverName)}<br><br>
            ${s.intro}
          </p>

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">${s.yourRegistration}</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555;width:40%">${s.driver}</td>
              <td style="padding:8px 12px;font-weight:bold">${data.driverName}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">${s.copilot}</td>
              <td style="padding:8px 12px;font-weight:bold">${data.copilotName}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">${s.email}</td>
              <td style="padding:8px 12px">${data.email}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#555">${s.phone}</td>
              <td style="padding:8px 12px">${data.phone}</td>
            </tr>
            <tr style="background:#f0f7f4">
              <td style="padding:8px 12px;color:#555">${s.vehicle}</td>
              <td style="padding:8px 12px">${data.carMake} ${data.carModel} — ${data.carYear}</td>
            </tr>
            ${data.extraParticipants > 0 ? `<tr>
              <td style="padding:8px 12px;color:#555">${s.extraParticipants}</td>
              <td style="padding:8px 12px">${data.extraNames.join(", ")}</td>
            </tr>` : ""}
          </table>

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">${s.mealSelections}</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
            <tr style="background:#2D6A4F">
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">${s.participant}</th>
              <th style="padding:8px 12px;text-align:left;color:white;font-size:13px">${s.selection}</th>
            </tr>
            ${mealRows}
          </table>

          <div style="background:#f0f7f4;border-left:4px solid #2D6A4F;padding:20px;margin-bottom:24px;border-radius:4px">
            <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px">${s.priceSummary}</h3>
            <p style="margin:4px 0;color:#555;font-size:14px">${s.teamEntry}: <strong>€125</strong></p>
            ${data.extraParticipants > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">${s.extraLine(data.extraParticipants, extraPersonCost)}</p>` : ""}
            ${data.mealCost > 0 ? `<p style="margin:4px 0;color:#555;font-size:14px">${s.mealsLine(data.mealChoices.filter((m) => m.include).length, data.mealCost)}</p>` : ""}
            <p style="margin:16px 0 0;font-size:20px;font-weight:bold;color:#2D6A4F">${s.totalDue}: €${data.total}</p>
          </div>

          <div style="background:#e8f4ee;border:1px solid #52B788;border-radius:6px;padding:20px;margin-bottom:24px">
            <h3 style="color:#2D6A4F;margin:0 0 16px;font-size:15px">${s.paymentInstructions}</h3>
            <p style="margin:0 0 12px;color:#555;font-size:14px;line-height:1.6">${s.paymentIntro(data.total)}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px">
              <tr style="background:#d4ecdf">
                <td style="padding:8px 12px;color:#555;width:40%;font-size:14px">${s.accountName}</td>
                <td style="padding:8px 12px;font-weight:bold;font-size:14px">${ACCOUNT_NAME}</td>
              </tr>
              <tr style="background:white">
                <td style="padding:8px 12px;color:#555;font-size:14px">${s.bank}</td>
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
              <p style="margin:0 0 4px;color:#52B788;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;font-weight:bold">${s.paymentCommLabel}</p>
              <p style="margin:0;color:white;font-size:15px;font-weight:bold;font-family:monospace">${paymentRef}</p>
            </div>
            <p style="margin:12px 0 0;color:#555;font-size:13px;line-height:1.6">${s.paymentWarning}</p>
          </div>

          <h3 style="color:#2D6A4F;margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:0.08em">${s.eventDetails}</h3>
          <div style="border:1px solid #e2ede8;border-radius:6px;padding:16px;font-size:14px;color:#555;line-height:2">
            <strong style="color:#2D6A4F">📅</strong> ${s.date}<br>
            <strong style="color:#2D6A4F">⏰</strong> ${s.startBriefing}<br>
            <strong style="color:#2D6A4F">📍</strong> ${s.location}<br>
            <strong style="color:#2D6A4F">🗺</strong> ${s.routebook}
          </div>

          <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.7">${s.closing}</p>

        </td></tr>

        <tr><td style="background:#1a2e24;padding:20px;text-align:center">
          <p style="color:#52B788;margin:0 0 4px;font-size:12px">Rotary Club Bascharage-Kordall — ${s.motto}</p>
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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lang: "en" | "fr" | "lb" = body.lang === "en" ? "en" : body.lang === "fr" ? "fr" : "lb";
    const s = emailStrings[lang];
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

    // Email 1: organiser copy (always in the form language)
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: buildRaw(
          ORGANISER_RECIPIENTS,
          s.subjectOrganiser(reference, body.driverName, body.copilotName),
          buildOrganiserHtml(body, reference, lang),
          body.email
        ),
      },
    });

    // Email 2: driver confirmation in the same language
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: buildRaw(
          body.email,
          s.subjectDriver(body.driverName, body.copilotName),
          buildDriverHtml(body, reference, lang)
        ),
      },
    });

    return NextResponse.json({ reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Registration error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
