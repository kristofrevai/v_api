/**
 * E-mail küldés a Resend API-n keresztül - három funkció:
 *  1) sendOrderNotificationEmail          - rendelés-értesítő a boltvezetőnek (CSV melléklettel)
 *  2) sendCustomerOrderConfirmationEmail  - köszönő/visszaigazoló e-mail a vásárlónak
 *  3) sendWelcomeEmail                    - üdvözlő e-mail regisztrációkor
 * ────────────────────────────────────────────────────────────────────────
 * A boltvezetői e-mail tartalmaz egy táblázatot a rendelt tételekről
 * (Megnevezés / Kiszerelés / Mennyiség oszlopokkal), fölötte egy egyesített,
 * középre igazított cellában a megrendelő nevével (ez a HTML e-mail
 * törzsében natívan megjelenik, nincs hozzá külön könyvtár szükséges).
 *
 * Emellett egy CSV fájl is csatolásra kerül, ugyanazzal a 3 oszloppal
 * (Megnevezés / Kiszerelés / Mennyiség), a megrendelő nevével az első
 * sorban - FONTOS: a CSV formátum önmagában nem támogat egyesített vagy
 * középre igazított cellákat (ez egy egyszerű szöveges formátum), ezért ott
 * a név egy önálló, első sorként szerepel, nem "egyesítve".
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   RESEND_API_KEY     - a Resend fiókodból (resend.com)
 *   NOTIFY_EMAIL        - ide (a boltvezető e-mail címére) érkeznek a rendelés-értesítések
 *   NOTIFY_FROM_EMAIL   - opcionális, a feladó cím (alapértelmezett: Resend teszt domain)
 */

function escapeHtml(str) {
  return String(str === undefined || str === null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function customerDisplayName(order) {
  const c = order.customer || {};
  return c.cegnev || c.nev || "Vásárló";
}

// CSV mezők idézőjelezése, ha pontosvessző/idézőjel/sortörés van bennük.
function csvField(value) {
  const s = String(value === undefined || value === null ? "" : value);
  if (/[;"\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(order) {
  const rows = [
    [customerDisplayName(order)],
    [],
    ["Megnevezés", "Kiszerelés", "Mennyiség"],
  ];
  (order.items || []).forEach(function (it) {
    rows.push([it.name, it.unit, it.qty]);
  });
  return rows.map(function (r) { return r.map(csvField).join(";"); }).join("\r\n");
}

function buildHtml(order, orderId) {
  const c = order.customer || {};
  const itemsRows = (order.items || []).map(function (it) {
    return (
      "<tr>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;">' + escapeHtml(it.name) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;">' + escapeHtml(it.unit) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">' + escapeHtml(it.qty) + "</td>" +
      "</tr>"
    );
  }).join("");

  const paymentLabel = order.paymentMethod === "cod" ? "Utánvét" : "Bankkártya";

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#333;">' +
      '<h2 style="color:#ff7a18;margin-bottom:4px;">Új rendelés érkezett</h2>' +
      '<p style="color:#999;margin-top:0;">Rendelésazonosító: ' + escapeHtml(orderId) + "</p>" +
      "<p><strong>Fizetési mód:</strong> " + escapeHtml(paymentLabel) + "<br>" +
      "<strong>Szállítási nap:</strong> " + escapeHtml(order.deliveryDate || "-") + "</p>" +

      '<h3 style="border-bottom:1px solid #eee;padding-bottom:6px;">Megrendelő adatai</h3>' +
      '<table style="border-collapse:collapse;">' +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Cég/étterem</td><td style="padding:3px 0;"><strong>' + escapeHtml(c.cegnev) + "</strong></td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Kapcsolattartó</td><td style="padding:3px 0;"><strong>' + escapeHtml(c.nev) + "</strong></td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Telefon</td><td style="padding:3px 0;">' + escapeHtml(c.telefon) + "</td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">E-mail</td><td style="padding:3px 0;">' + escapeHtml(c.email) + "</td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Cím</td><td style="padding:3px 0;">' + escapeHtml(c.cim) + "</td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;vertical-align:top;">Megjegyzés</td><td style="padding:3px 0;">' + (escapeHtml(c.megjegyzes) || "-") + "</td></tr>" +
      "</table>" +

      '<table style="border-collapse:collapse;width:100%;margin-top:24px;">' +
        "<thead>" +
          '<tr><th colspan="3" style="padding:10px;border:1px solid #ddd;text-align:center;background:#fff3e6;font-size:15px;">' + escapeHtml(customerDisplayName(order)) + "</th></tr>" +
          '<tr style="background:#f7f2eb;">' +
            '<th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Megnevezés</th>' +
            '<th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Kiszerelés</th>' +
            '<th style="padding:6px 10px;border:1px solid #ddd;text-align:center;">Mennyiség</th>' +
          "</tr>" +
        "</thead>" +
        "<tbody>" + itemsRows + "</tbody>" +
      "</table>" +

      '<p style="color:#999;font-size:12px;margin-top:20px;">A csatolt CSV fájl közvetlenül megnyitható Excelben (a megrendelő neve az első sorban szerepel).</p>' +
    "</div>"
  );
}

const HU_MONTHS = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
const HU_WEEKDAYS = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];

function formatDeliveryDateHu(iso) {
  if (!iso) return "-";
  const parts = String(iso).split("-").map(Number);
  if (parts.length !== 3) return iso;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(d.getTime())) return iso;
  return d.getFullYear() + ". " + HU_MONTHS[d.getMonth()] + " " + d.getDate() + ". (" + HU_WEEKDAYS[d.getDay()] + ")";
}

async function sendViaResend(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Hiányzó RESEND_API_KEY környezeti változó - e-mail kihagyva.");
    return;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend e-mail küldési hiba:", errText);
    }
  } catch (err) {
    console.error("E-mail küldési hiba:", err);
  }
}

async function sendOrderNotificationEmail(order, orderId) {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!notifyEmail) {
    console.error("Hiányzó NOTIFY_EMAIL környezeti változó - boltvezetői értesítő e-mail kihagyva.");
    return;
  }

  const csvContent = buildCsv(order);
  const csvBase64 = Buffer.from(csvContent, "utf8").toString("base64");
  const paymentLabel = order.paymentMethod === "cod" ? "Utánvét" : "Bankkártya";

  await sendViaResend({
    from: fromEmail,
    to: [notifyEmail],
    subject: "Új rendelés (" + paymentLabel + ") - #" + orderId,
    html: buildHtml(order, orderId),
    attachments: [
      { filename: "rendeles_" + orderId + ".csv", content: csvBase64 },
    ],
  });
}

// ─── Vásárlói visszaigazoló e-mail (köszönő üzenet + szállítási info) ─────
function buildCustomerConfirmationHtml(order, orderId) {
  const c = order.customer || {};
  const itemsRows = (order.items || []).map(function (it) {
    return (
      "<tr>" +
      '<td style="padding:6px 10px;border:1px solid #eee;">' + escapeHtml(it.name) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #eee;">' + escapeHtml(it.unit) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #eee;text-align:center;">' + escapeHtml(it.qty) + "</td>" +
      "</tr>"
    );
  }).join("");

  const paymentLabel = order.paymentMethod === "cod" ? "Utánvét (fizetés a kiszállításkor)" : "Bankkártya (Stripe)";
  const deliveryLabel = formatDeliveryDateHu(order.deliveryDate);
  const greetingName = c.nev || c.cegnev || "";

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">' +
      '<h2 style="color:#ff7a18;margin-bottom:4px;">Köszönjük a rendelését' + (greetingName ? ", " + escapeHtml(greetingName) : "") + "!</h2>" +
      '<p style="color:#555;line-height:1.6;">Sikeresen rögzítettük megrendelését. Az alábbiakban összefoglaljuk a részleteket.</p>' +

      '<div style="background:#fff3e6;border-radius:10px;padding:16px 18px;margin:20px 0;">' +
        '<p style="margin:0;font-size:14px;color:#7a5f3d;"><i>Szállítás várható napja</i></p>' +
        '<p style="margin:2px 0 0 0;font-size:18px;font-weight:bold;color:#ff7a18;">' + escapeHtml(deliveryLabel) + "</p>" +
      "</div>" +

      '<p style="font-size:13.5px;color:#666;"><strong>Rendelésazonosító:</strong> ' + escapeHtml(orderId) + "<br>" +
      "<strong>Fizetési mód:</strong> " + escapeHtml(paymentLabel) + "</p>" +

      '<h3 style="border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px;">Megrendelt tételek</h3>' +
      '<table style="border-collapse:collapse;width:100%;">' +
        "<thead><tr style=\"background:#f7f2eb;\">" +
          '<th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Megnevezés</th>' +
          '<th style="padding:6px 10px;border:1px solid #eee;text-align:left;">Kiszerelés</th>' +
          '<th style="padding:6px 10px;border:1px solid #eee;text-align:center;">Mennyiség</th>' +
        "</tr></thead>" +
        "<tbody>" + itemsRows + "</tbody>" +
      "</table>" +

      '<p style="color:#999;font-size:12.5px;margin-top:26px;line-height:1.6;">Ha bármi kérdése merülne fel a rendelésével kapcsolatban, keressen minket bizalommal.<br>Köszönjük, hogy a Révai Fruit Kft-t választotta!</p>' +
    "</div>"
  );
}

async function sendCustomerOrderConfirmationEmail(order, orderId) {
  const c = order.customer || {};
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!c.email) {
    console.error("Hiányzó vásárlói e-mail cím - visszaigazoló e-mail kihagyva.");
    return;
  }

  await sendViaResend({
    from: fromEmail,
    to: [c.email],
    subject: "Köszönjük a rendelését! - #" + orderId,
    html: buildCustomerConfirmationHtml(order, orderId),
  });
}

// ─── Üdvözlő e-mail regisztrációkor ────────────────────────────────────────
function buildWelcomeHtml(name, accountType) {
  const accountLabel = accountType === "company" ? "céges" : "magánszemély";
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">' +
      '<h2 style="color:#ff7a18;margin-bottom:4px;">Üdvözöljük' + (name ? ", " + escapeHtml(name) : "") + "!</h2>" +
      '<p style="color:#555;line-height:1.7;">Köszönjük, hogy regisztrált a Révai Fruit Kft. webáruházában (' + escapeHtml(accountLabel) + ' fiókkal)! Mostantól elmentheti kedvenc termékeit, gyorsabban rendelhet, és nyomon követheti korábbi rendeléseit a profiljában.</p>' +
      '<p style="color:#555;line-height:1.7;">Ha bármilyen kérdése van, keressen minket bizalommal.</p>' +
      '<p style="color:#999;font-size:12.5px;margin-top:26px;">Jó vásárlást kívánunk!<br>Révai Fruit Kft.</p>' +
    "</div>"
  );
}

async function sendWelcomeEmail(name, email, accountType) {
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!email) {
    console.error("Hiányzó e-mail cím - üdvözlő e-mail kihagyva.");
    return;
  }

  await sendViaResend({
    from: fromEmail,
    to: [email],
    subject: "Üdvözöljük a Révai Fruit Kft. webáruházában!",
    html: buildWelcomeHtml(name, accountType),
  });
}

// ─── Jelszó-visszaállító e-mail (saját, márkázott sablon Resend-en keresztül) ──
// Mivel a Firebase Console-ban nem mindig szerkeszthető a beépített sablon
// (pl. Spark/ingyenes csomagon gyakran letiltott funkció), ezt a levelet mi
// magunk küldjük ki, saját dizájnnal - a linket a Firebase Admin SDK
// generálja (lásd api/send-password-reset-email.js), csak a KÉZBESÍTÉS
// történik a mi oldalunkon, Resend-en keresztül.
function buildPasswordResetHtml(email, resetLink) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf8f4; padding:32px 16px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.06);">' +

          '<tr><td align="center" style="background-color:#1f1f1f; padding:28px 24px;">' +
            '<span style="font-family:Georgia, \'Times New Roman\', serif; font-size:22px; font-weight:bold; color:#ffffff; letter-spacing:0.5px;">Révai Fruit <span style="color:#ff7a18;">Kft.</span></span>' +
          '</td></tr>' +

          '<tr><td style="background-color:#ff7a18; height:4px; line-height:4px; font-size:0;">&nbsp;</td></tr>' +

          '<tr><td style="padding:36px 32px 8px 32px;">' +
            '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;"><tr>' +
              '<td align="center" style="width:64px; height:64px; background-color:#fff3e6; border-radius:50%; font-size:28px; line-height:64px;">🔑</td>' +
            '</tr></table>' +
            '<h1 style="font-family:Georgia, \'Times New Roman\', serif; font-size:22px; color:#1f1f1f; text-align:center; margin:0 0 16px 0;">Jelszó visszaállítása</h1>' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#555555; text-align:center; margin:0 0 8px 0;">Kedves Vásárlónk!</p>' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#555555; text-align:center; margin:0 0 28px 0;">Kérelmet kaptunk a(z) <strong style="color:#1f1f1f;">' + escapeHtml(email) + '</strong> e-mail-fiókhoz tartozó jelszó visszaállítására. Az alábbi gombra kattintva biztonságosan beállíthat egy új jelszót.</p>' +
          '</td></tr>' +

          '<tr><td align="center" style="padding:0 32px 32px 32px;">' +
            '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
              '<td align="center" style="border-radius:50px; background-color:#ff7a18;">' +
                '<a href="' + resetLink + '" target="_blank" style="display:inline-block; padding:15px 38px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:50px;">Új jelszó beállítása</a>' +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          '<tr><td style="padding:0 32px 28px 32px;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:12.5px; line-height:1.6; color:#aaaaaa; text-align:center; margin:0;">Ha a gomb nem működik, másolja be ezt a linket a böngészőjébe:<br>' +
              '<a href="' + resetLink + '" style="color:#ff7a18; word-break:break-all;">' + resetLink + '</a></p>' +
          '</td></tr>' +

          '<tr><td style="padding:0 32px 32px 32px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8e1; border-radius:10px;"><tr>' +
              '<td style="padding:14px 16px;">' +
                '<p style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#7a5f3d; margin:0;">⚠️ Ha Ön nem kérte a jelszó visszaállítását, egyszerűen hagyja figyelmen kívül ezt az e-mailt - a fiókja biztonságban van, és a jelszava nem változik meg.</p>' +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          '<tr><td style="background-color:#fcfaf7; padding:22px 32px; border-top:1px solid #f0e6d8;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:12.5px; color:#999999; text-align:center; margin:0;">Köszönettel,<br><strong style="color:#666666;">Révai Fruit Kft. csapata</strong></p>' +
          '</td></tr>' +

        '</table>' +
      '</td></tr>' +
    '</table>'
  );
}

async function sendPasswordResetEmailCustom(email, resetLink) {
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!email || !resetLink) {
    console.error("Hiányzó e-mail cím vagy visszaállító link - jelszó-visszaállító e-mail kihagyva.");
    return;
  }

  await sendViaResend({
    from: fromEmail,
    to: [email],
    subject: "Jelszó visszaállítása - Révai Fruit Kft.",
    html: buildPasswordResetHtml(email, resetLink),
  });
}

module.exports = {
  sendOrderNotificationEmail,
  sendCustomerOrderConfirmationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmailCustom,
};
