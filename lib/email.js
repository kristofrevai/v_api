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
  const itemsRows = (order.items || []).map(function (it, idx) {
    const bg = idx % 2 === 0 ? "#ffffff" : "#fbf8f4";
    return (
      "<tr style=\"background-color:" + bg + ";\">" +
      '<td style="padding:11px 14px; font-family:Arial, Helvetica, sans-serif; font-size:13.5px; color:#333333; border-bottom:1px solid #f0e6d8;">' + escapeHtml(it.name) + "</td>" +
      '<td style="padding:11px 14px; font-family:Arial, Helvetica, sans-serif; font-size:13.5px; color:#777777; border-bottom:1px solid #f0e6d8;">' + escapeHtml(it.unit) + "</td>" +
      '<td style="padding:11px 14px; font-family:Arial, Helvetica, sans-serif; font-size:13.5px; color:#333333; font-weight:bold; text-align:center; border-bottom:1px solid #f0e6d8;">' + escapeHtml(it.qty) + "</td>" +
      "</tr>"
    );
  }).join("");

  const paymentLabel = order.paymentMethod === "cod" ? "Utánvét (fizetés a kiszállításkor)" : "Bankkártya";
  const deliveryLabel = formatDeliveryDateHu(order.deliveryDate);
  const greetingName = c.nev || c.cegnev || "";

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf8f4; padding:32px 16px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.06);">' +

          // Fejléc
          '<tr><td align="center" style="background-color:#1f1f1f; padding:28px 24px;">' +
            '<span style="font-family:Georgia, \'Times New Roman\', serif; font-size:22px; font-weight:bold; color:#ffffff; letter-spacing:0.5px;">Révai Fruit <span style="color:#ff7a18;">Kft.</span></span>' +
          '</td></tr>' +
          '<tr><td style="background-color:#ff7a18; height:4px; line-height:4px; font-size:0;">&nbsp;</td></tr>' +

          // Üdvözlés + ikon
          '<tr><td style="padding:36px 32px 8px 32px;">' +
            '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;"><tr>' +
              '<td align="center" style="width:64px; height:64px; background-color:#eafaf0; border-radius:50%; font-size:28px; line-height:64px;">✅</td>' +
            '</tr></table>' +
            '<h1 style="font-family:Georgia, \'Times New Roman\', serif; font-size:22px; color:#1f1f1f; text-align:center; margin:0 0 14px 0;">Köszönjük a rendelését' + (greetingName ? ", " + escapeHtml(greetingName) : "") + "!</h1>" +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#555555; text-align:center; margin:0 0 4px 0;">Sikeresen rögzítettük megrendelését. Az alábbiakban összefoglaljuk a részleteket.</p>' +
          '</td></tr>' +

          // Szállítási nap kiemelés
          '<tr><td style="padding:8px 32px 0 32px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3e6; border-radius:12px;"><tr>' +
              '<td align="center" style="padding:18px 20px;">' +
                '<p style="font-family:Arial, Helvetica, sans-serif; font-size:12.5px; color:#a5761f; margin:0; text-transform:uppercase; letter-spacing:0.5px;">🚚 Szállítás várható napja</p>' +
                '<p style="font-family:Georgia, \'Times New Roman\', serif; font-size:20px; font-weight:bold; color:#ff7a18; margin:6px 0 0 0;">' + escapeHtml(deliveryLabel) + "</p>" +
              '</td>' +
            '</tr></table>' +
          '</td></tr>' +

          // Rendelés adatai
          '<tr><td style="padding:20px 32px 0 32px;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#999999; margin:0; text-align:center;">Rendelésazonosító: <strong style="color:#666666;">' + escapeHtml(orderId) + '</strong> &nbsp;•&nbsp; Fizetési mód: <strong style="color:#666666;">' + escapeHtml(paymentLabel) + "</strong></p>" +
          '</td></tr>' +

          // Tételek táblázat
          '<tr><td style="padding:26px 32px 8px 32px;">' +
            '<p style="font-family:Georgia, \'Times New Roman\', serif; font-size:16px; color:#1f1f1f; margin:0 0 12px 0; font-weight:bold;">Megrendelt tételek</p>' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e6d8; border-radius:10px; overflow:hidden;">' +
              '<tr style="background-color:#fff3e6;">' +
                '<th align="left" style="padding:10px 14px; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; color:#a5761f; text-transform:uppercase; letter-spacing:0.4px;">Megnevezés</th>' +
                '<th align="left" style="padding:10px 14px; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; color:#a5761f; text-transform:uppercase; letter-spacing:0.4px;">Kiszerelés</th>' +
                '<th align="center" style="padding:10px 14px; font-family:Arial, Helvetica, sans-serif; font-size:11.5px; color:#a5761f; text-transform:uppercase; letter-spacing:0.4px;">Menny.</th>' +
              '</tr>' +
              itemsRows +
            '</table>' +
          '</td></tr>' +

          // Lábléc
          '<tr><td style="padding:28px 32px 32px 32px;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.7; color:#666666; text-align:center; margin:0;">Ha bármi kérdése merülne fel a rendelésével kapcsolatban, keressen minket bizalommal.<br>Köszönjük, hogy a Révai Fruit Kft-t választotta!</p>' +
          '</td></tr>' +
          '<tr><td style="background-color:#fcfaf7; padding:20px 32px; border-top:1px solid #f0e6d8;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#aaaaaa; text-align:center; margin:0;">Révai Fruit Kft.</p>' +
          '</td></tr>' +

        '</table>' +
      '</td></tr>' +
    '</table>'
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
  const firstName = (name || "").split(" ")[0] || "";

  const features = [
    { icon: "❤️", title: "Kedvencek", text: "Mentse el a gyakran rendelt termékeit, hogy legközelebb egy kattintással megtalálja őket." },
    { icon: "⚡", title: "Gyors rendelés", text: "Mentett szállítási adatokkal és a \"Rendelés újra\" gombbal percek alatt leadhatja a következő rendelését." },
    { icon: "📦", title: "Rendeléstörténet", text: "Bármikor visszanézheti korábbi rendeléseit és azok állapotát a profiljában." },
  ];

  const featureRows = features.map(function (f) {
    return (
      '<tr><td style="padding:10px 0;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>' +
          '<td valign="top" style="width:44px;">' +
            '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
              '<td align="center" style="width:38px; height:38px; background-color:#fff3e6; border-radius:50%; font-size:17px; line-height:38px;">' + f.icon + '</td>' +
            '</tr></table>' +
          '</td>' +
          '<td valign="top" style="padding-left:12px;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#1f1f1f; margin:2px 0 3px 0;">' + f.title + '</p>' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#777777; margin:0;">' + f.text + '</p>' +
          '</td>' +
        '</tr></table>' +
      '</td></tr>'
    );
  }).join("");

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf8f4; padding:32px 16px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.06);">' +

          // Fejléc
          '<tr><td align="center" style="background-color:#1f1f1f; padding:28px 24px;">' +
            '<span style="font-family:Georgia, \'Times New Roman\', serif; font-size:22px; font-weight:bold; color:#ffffff; letter-spacing:0.5px;">Révai Fruit <span style="color:#ff7a18;">Kft.</span></span>' +
          '</td></tr>' +
          '<tr><td style="background-color:#ff7a18; height:4px; line-height:4px; font-size:0;">&nbsp;</td></tr>' +

          // Üdvözlés
          '<tr><td style="padding:40px 32px 8px 32px;">' +
            '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px auto;"><tr>' +
              '<td align="center" style="width:68px; height:68px; background-color:#fff3e6; border-radius:50%; font-size:30px; line-height:68px;">🎉</td>' +
            '</tr></table>' +
            '<h1 style="font-family:Georgia, \'Times New Roman\', serif; font-size:24px; color:#1f1f1f; text-align:center; margin:0 0 14px 0;">Üdvözöljük' + (firstName ? ", " + escapeHtml(firstName) : "") + "!</h1>" +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#555555; text-align:center; margin:0 0 4px 0;">Köszönjük, hogy regisztrált a Révai Fruit Kft. webáruházában (' + escapeHtml(accountLabel) + ' fiókkal). Mostantól még kényelmesebben rendelhet nálunk.</p>' +
          '</td></tr>' +

          // Feature lista
          '<tr><td style="padding:22px 32px 6px 32px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f0e6d8; padding-top:6px;">' +
              featureRows +
            '</table>' +
          '</td></tr>' +

          // Lábléc
          '<tr><td style="padding:26px 32px 32px 32px;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#777777; text-align:center; margin:0;">Ha bármilyen kérdése van, keressen minket bizalommal.</p>' +
          '</td></tr>' +
          '<tr><td style="background-color:#fcfaf7; padding:22px 32px; border-top:1px solid #f0e6d8;">' +
            '<p style="font-family:Arial, Helvetica, sans-serif; font-size:12.5px; color:#999999; text-align:center; margin:0;">Jó vásárlást kívánunk!<br><strong style="color:#666666;">Révai Fruit Kft. csapata</strong></p>' +
          '</td></tr>' +

        '</table>' +
      '</td></tr>' +
    '</table>'
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
