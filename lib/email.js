/**
 * E-mail küldés a Resend API-n keresztül - HÉT funkció:
 *  1) sendOrderNotificationEmail              - rendelés-értesítő a boltvezetőnek (CSV melléklettel)
 *  2) sendCustomerOrderConfirmationEmail      - visszaigazoló e-mail a vásárlónak
 *  3) sendWelcomeEmail                        - üdvözlő e-mail regisztrációkor
 *  4) sendPasswordResetEmailCustom            - jelszó-visszaállító e-mail
 *  5) sendVerificationEmailCustom             - e-mail cím megerősítő e-mail
 *  6) sendRegistrationAdminNotificationEmail  - ÚJ: admin-értesítő új regisztrációról, "Jóváhagyás" gombbal
 *  7) sendApprovalEmail                       - ÚJ: "Fiókja jóváhagyva" e-mail a vásárlónak
 * ────────────────────────────────────────────────────────────────────────
 * DIZÁJN: az összes sablon egy közös, letisztult "email shell"-re épül
 * (lásd emailShell() lentebb) - egyszínű felirat-fejléc vékony narancs
 * vonallal, semleges tábla-alapú tartalom, visszafogott, egyetlen
 * hangsúlyszínt (narancs) használó kiemelések. Szándékosan NINCS benne
 * emoji-ikon körben, színes "feature kártya" rács vagy több pasztell
 * háttérszín egyszerre - ezek a minták sablonosnak, "AI-generáltnak"
 * hatnak. A cél egy visszafogott, számla-/nyugta-szerű megjelenés.
 *
 * A boltvezetői e-mailek (sima HTML, nem az emailShell-t használják, mert
 * belső, funkcionális levelek) egyszerű táblázatos formában mutatják az
 * adatokat.
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   RESEND_API_KEY       - a Resend fiókodból (resend.com)
 *   NOTIFY_EMAIL          - ide (a boltvezető e-mail címére) érkeznek a rendelés- és regisztráció-értesítések
 *   NOTIFY_FROM_EMAIL     - opcionális, a feladó cím (alapértelmezett: Resend teszt domain)
 *   SHOP_URL               - opcionális, a webshop nyilvános URL-je (a "Fiók jóváhagyva" e-mail CTA gombjához)
 */

function escapeHtml(str) {
  return String(str === undefined || str === null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// Mennyiség + kiszerelés egységes formázása, UGYANAZZAL a heurisztikával,
// mint a kliensoldali webshop.html-ben: ha a kiszerelés szövege (unit)
// tartalmaz számjegyet (pl. "5 kg", "10 kg" - egy savanyúság/szárazáru
// választható kiszerelése), akkor "csomagolt" tételnek tekintjük, és
// "1db 5 kg" formában írjuk ki. A sima kilós/darabos alaptermékeknél
// (unit: "kg", "db", "köteg" stb., számjegy nélkül) a régi "2 kg" forma
// marad.
function formatQtyUnit(qty, unit) {
  const u = unit || "";
  const packaged = /\d/.test(u);
  return packaged ? qty + "db " + u : qty + " " + u;
}

function customerDisplayName(order) {
  const c = order.customer || {};
  return c.cegnev || c.nev || "Vásárló";
}

// Fizetési mód megnevezése - a boltvezetői e-mailhez és a levél tárgyához
// (rövid forma), illetve a vásárlói visszaigazoláshoz (kicsit bővebb forma,
// amely utalásos számlánál jelzi, hogy a számla csak a szállítás után jön).
function paymentMethodShortLabel(method) {
  if (method === "cod") return "Utánvét";
  if (method === "bank_transfer") return "Utalásos számla";
  return "Bankkártya";
}

function paymentMethodCustomerLabel(method) {
  if (method === "cod") return "Utánvét (fizetés a kiszállításkor)";
  if (method === "bank_transfer") return "Utalásos számla (a számlát a szállítás után küldjük)";
  return "Bankkártya";
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

// ═══════════════════════════════════════════════════════════════════════
// KÖZÖS E-MAIL VÁZ (fejléc + kártya + lábléc) - minden vásárlónak szóló
// levél ezt használja, hogy egységes, letisztult megjelenésük legyen.
// ═══════════════════════════════════════════════════════════════════════
const FONT_HEADING = "Georgia, 'Times New Roman', serif";
const FONT_BODY = "Arial, Helvetica, sans-serif";
const COLOR_ACCENT = "#ff7a18";
const COLOR_TEXT = "#1f1f1f";
const COLOR_MUTED = "#8a8a8a";
const COLOR_BORDER = "#ececec";

function emailShell(bodyRowsHtml, footerNote) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f4f1; padding:40px 16px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border:1px solid ' + COLOR_BORDER + '; border-radius:10px;">' +

          // Fejléc - egyszerű felirat, vékony narancs alsó vonal (nincs tömör
          // színes sáv vagy dekoratív elem, csak a márkanév).
          '<tr><td style="padding:26px 36px 18px 36px; border-bottom:2px solid ' + COLOR_ACCENT + ';">' +
            '<span style="font-family:' + FONT_HEADING + '; font-size:18px; font-weight:bold; color:' + COLOR_TEXT + '; letter-spacing:0.2px;">Révai Fruit <span style="color:' + COLOR_ACCENT + ';">Kft.</span></span>' +
          '</td></tr>' +

          bodyRowsHtml +

          // Lábléc
          '<tr><td style="padding:20px 36px; border-top:1px solid ' + COLOR_BORDER + ';">' +
            '<p style="font-family:' + FONT_BODY + '; font-size:11.5px; color:' + COLOR_MUTED + '; text-align:center; margin:0;">' + escapeHtml(footerNote || "Révai Fruit Kft.") + '</p>' +
          '</td></tr>' +

        '</table>' +
      '</td></tr>' +
    '</table>'
  );
}

// Egyszerű "címke - érték" sorokból álló táblázat (pl. rendelésazonosító,
// szállítási nap, fizetési mód) - vékony elválasztó vonalakkal, díszítő
// színes háttér nélkül.
function detailRowsTable(rows) {
  const rowsHtml = rows.map(function (row, idx) {
    const isLast = idx === rows.length - 1;
    const border = isLast ? "" : "border-bottom:1px solid #f2f2f2;";
    return (
      "<tr>" +
        '<td style="padding:10px 0; font-family:' + FONT_BODY + '; font-size:12.5px; color:' + COLOR_MUTED + '; ' + border + '">' + escapeHtml(row[0]) + "</td>" +
        '<td style="padding:10px 0; font-family:' + FONT_BODY + '; font-size:13px; color:' + COLOR_TEXT + '; font-weight:bold; text-align:right; ' + border + '">' + escapeHtml(row[1]) + "</td>" +
      "</tr>"
    );
  }).join("");
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ' + COLOR_BORDER + ';">' + rowsHtml + "</table>";
}

// Visszafogott, egy-akcentszínű megjegyzés-doboz (bal oldali vékony csík,
// halvány semleges háttér) - a korábbi, több élénk pasztellszínt használó
// "figyelmeztető kártyák" helyett, hogy ne tűnjön sablonos AI-dizájnnak.
function noteBox(text) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="padding:13px 16px; background-color:#faf8f5; border-left:3px solid ' + COLOR_ACCENT + '; border-radius:2px;">' +
        '<p style="margin:0; font-family:' + FONT_BODY + '; font-size:12.5px; line-height:1.65; color:#6b6b6b;">' + text + '</p>' +
      '</td>' +
    '</tr></table>'
  );
}

function ctaButton(href, label) {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="border-radius:6px; background-color:' + COLOR_ACCENT + ';">' +
        '<a href="' + href + '" target="_blank" style="display:inline-block; padding:13px 32px; font-family:' + FONT_BODY + '; font-size:14px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:6px;">' + escapeHtml(label) + '</a>' +
      '</td>' +
    '</tr></table>'
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 1) BOLTVEZETŐI RENDELÉS-ÉRTESÍTŐ (belső, funkcionális levél - nem az
//    emailShell-t használja, mert ez nem márka-arculati, hanem munkalevél)
// ═══════════════════════════════════════════════════════════════════════

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

  const paymentLabel = paymentMethodShortLabel(order.paymentMethod);

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#333;">' +
      '<h2 style="color:#ff7a18;margin-bottom:4px;">Új rendelés érkezett</h2>' +
      '<p style="color:#999;margin-top:0;">Rendelésazonosító: ' + escapeHtml(orderId) + "</p>" +
      "<p><strong>Fizetési mód:</strong> " + escapeHtml(paymentLabel) + "<br>" +
      "<strong>Szállítási nap:</strong> " + escapeHtml(order.deliveryDate || "-") + "</p>" +
      (order.paymentMethod === "bank_transfer" ?
        '<p style="background:#faf8f5;color:#6b5a2e;padding:10px 14px;border-radius:4px;border-left:3px solid #ff7a18;font-size:13px;">Utalásos számlás rendelés (céges fiók) - a számlát csak a tényleges, kiszállított mennyiség megerősítése után szabad kiállítani.</p>'
        : "") +

      '<h3 style="border-bottom:1px solid #eee;padding-bottom:6px;">Megrendelő adatai</h3>' +
      '<table style="border-collapse:collapse;">' +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Cég/étterem</td><td style="padding:3px 0;"><strong>' + escapeHtml(c.cegnev) + "</strong></td></tr>" +
        (c.adoszam ? '<tr><td style="padding:3px 10px 3px 0;color:#666;">Adószám</td><td style="padding:3px 0;">' + escapeHtml(c.adoszam) + "</td></tr>" : "") +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Kapcsolattartó</td><td style="padding:3px 0;"><strong>' + escapeHtml(c.nev) + "</strong></td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Telefon</td><td style="padding:3px 0;">' + escapeHtml(c.telefon) + "</td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">E-mail</td><td style="padding:3px 0;">' + escapeHtml(c.email) + "</td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Cím</td><td style="padding:3px 0;">' + escapeHtml(c.cim) + "</td></tr>" +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;vertical-align:top;">Megjegyzés</td><td style="padding:3px 0;">' + (escapeHtml(c.megjegyzes) || "-") + "</td></tr>" +
      "</table>" +

      '<table style="border-collapse:collapse;width:100%;margin-top:24px;">' +
        "<thead>" +
          '<tr><th colspan="3" style="padding:10px;border:1px solid #ddd;text-align:center;background:#f7f5f2;font-size:15px;">' + escapeHtml(customerDisplayName(order)) + "</th></tr>" +
          '<tr style="background:#fafafa;">' +
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
  const paymentLabel = paymentMethodShortLabel(order.paymentMethod);

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

// ═══════════════════════════════════════════════════════════════════════
// 2) VÁSÁRLÓI VISSZAIGAZOLÓ E-MAIL
// ═══════════════════════════════════════════════════════════════════════
function buildCustomerConfirmationHtml(order, orderId) {
  const c = order.customer || {};
  const itemsRows = (order.items || []).map(function (it) {
    return (
      "<tr>" +
        '<td style="padding:10px 0; font-family:' + FONT_BODY + '; font-size:13.5px; color:' + COLOR_TEXT + '; border-top:1px solid #f2f2f2;">' +
          escapeHtml(it.name) +
        "</td>" +
        '<td style="padding:10px 0; font-family:' + FONT_BODY + '; font-size:13.5px; color:' + COLOR_TEXT + '; text-align:right; white-space:nowrap; border-top:1px solid #f2f2f2;">' +
          escapeHtml(formatQtyUnit(it.qty, it.unit)) +
        "</td>" +
      "</tr>"
    );
  }).join("");

  const paymentLabel = paymentMethodCustomerLabel(order.paymentMethod);
  const deliveryLabel = formatDeliveryDateHu(order.deliveryDate);
  const greetingName = c.nev || c.cegnev || "";
  const isBankTransfer = order.paymentMethod === "bank_transfer";

  const detailRows = [
    ["Rendelésazonosító", orderId],
    ["Szállítás napja", deliveryLabel],
    ["Fizetési mód", paymentLabel],
  ];

  const bodyRows =
    // Üdvözlés
    '<tr><td style="padding:32px 36px 4px 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:' + COLOR_ACCENT + '; font-weight:bold; margin:0 0 10px 0;">Rendelés visszaigazolva</p>' +
      '<h1 style="font-family:' + FONT_HEADING + '; font-size:21px; color:' + COLOR_TEXT + '; margin:0 0 10px 0;">Köszönjük' + (greetingName ? ", " + escapeHtml(greetingName) : "") + "!</h1>" +
      '<p style="font-family:' + FONT_BODY + '; font-size:13.5px; line-height:1.65; color:#666666; margin:0;">Sikeresen rögzítettük a megrendelését. Az alábbiakban összefoglaljuk a részleteket.</p>' +
    "</td></tr>" +

    // Rendelés részletei
    '<tr><td style="padding:22px 36px 0 36px;">' + detailRowsTable(detailRows) + "</td></tr>" +

    // Utalásos számla esetén kiegészítő megjegyzés
    (isBankTransfer ?
      '<tr><td style="padding:16px 36px 0 36px;">' +
        noteBox("Mivel céges fiókként utalásos számlával rendelt: a friss termékek ténylegesen kiszállított mennyisége eltérhet a megrendelttől, ezért a számlát a pontos mennyiség egyeztetése után állítjuk ki, és az utalási adatokkal együtt küldjük el Önnek.") +
      "</td></tr>"
      : "") +

    // Tételek
    '<tr><td style="padding:28px 36px 4px 36px;">' +
      '<p style="font-family:' + FONT_HEADING + '; font-size:14.5px; color:' + COLOR_TEXT + '; margin:0 0 2px 0; font-weight:bold;">Megrendelt tételek</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + itemsRows + "</table>" +
    "</td></tr>" +

    // Zárás
    '<tr><td style="padding:26px 36px 30px 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:12.5px; line-height:1.7; color:' + COLOR_MUTED + '; margin:0;">Kérdés esetén keressen minket bizalommal. Köszönjük, hogy a Révai Fruit Kft-t választotta.</p>' +
    "</td></tr>";

  return emailShell(bodyRows);
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
    subject: "Rendelés visszaigazolva - #" + orderId,
    html: buildCustomerConfirmationHtml(order, orderId),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 3) ÜDVÖZLŐ E-MAIL REGISZTRÁCIÓKOR
// ═══════════════════════════════════════════════════════════════════════
function buildWelcomeHtml(name, accountType) {
  const accountLabel = accountType === "company" ? "céges" : "magánszemély";
  const nameParts = (name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.length ? nameParts[nameParts.length - 1] : "";

  const features = [
    ["Kedvencek", "Mentse el a gyakran rendelt termékeit, hogy legközelebb egy kattintással megtalálja őket."],
    ["Gyors rendelés", "Mentett szállítási adatokkal és a \"Rendelés újra\" gombbal percek alatt leadhatja a következő rendelését."],
    ["Rendeléstörténet", "Bármikor visszanézheti korábbi rendeléseit és azok állapotát a profiljában."],
  ];

  const featureRows = features.map(function (f, idx) {
    const isLast = idx === features.length - 1;
    const border = isLast ? "" : "border-bottom:1px solid #f5f5f5;";
    return (
      '<tr><td style="padding:14px 0; ' + border + '">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>' +
          '<td valign="top" style="width:14px; padding-top:5px;">' +
            '<div style="width:6px; height:6px; background-color:' + COLOR_ACCENT + ';"></div>' +
          '</td>' +
          '<td valign="top">' +
            '<p style="font-family:' + FONT_BODY + '; font-size:13.5px; font-weight:bold; color:' + COLOR_TEXT + '; margin:0 0 3px 0;">' + escapeHtml(f[0]) + '</p>' +
            '<p style="font-family:' + FONT_BODY + '; font-size:13px; line-height:1.6; color:#777777; margin:0;">' + escapeHtml(f[1]) + '</p>' +
          '</td>' +
        '</tr></table>' +
      '</td></tr>'
    );
  }).join("");

  const bodyRows =
    '<tr><td style="padding:32px 36px 6px 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:' + COLOR_ACCENT + '; font-weight:bold; margin:0 0 10px 0;">Sikeres regisztráció</p>' +
      '<h1 style="font-family:' + FONT_HEADING + '; font-size:22px; color:' + COLOR_TEXT + '; margin:0 0 10px 0;">Üdvözöljük' + (firstName ? ", " + escapeHtml(firstName) : "") + "!</h1>" +
      '<p style="font-family:' + FONT_BODY + '; font-size:13.5px; line-height:1.65; color:#666666; margin:0;">Köszönjük, hogy regisztrált a Révai Fruit Kft. webáruházában (' + escapeHtml(accountLabel) + ' fiókkal). A fiókját munkatársunk hamarosan, manuálisan ellenőrzi és jóváhagyja - erről külön e-mailben értesítjük.</p>' +
    "</td></tr>" +

    '<tr><td style="padding:18px 36px 4px 36px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ' + COLOR_BORDER + ';">' +
        featureRows +
      "</table>" +
    "</td></tr>" +

    '<tr><td style="padding:24px 36px 30px 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:12.5px; line-height:1.6; color:' + COLOR_MUTED + '; margin:0;">Ha bármilyen kérdése van, keressen minket bizalommal. Jó vásárlást kívánunk!</p>' +
    "</td></tr>";

  return emailShell(bodyRows);
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
    subject: "Üdvözöljük a Révai Fruit Kft. webáruházában",
    html: buildWelcomeHtml(name, accountType),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 4) JELSZÓ-VISSZAÁLLÍTÓ E-MAIL (saját, márkázott sablon Resend-en keresztül)
// ═══════════════════════════════════════════════════════════════════════
// Mivel a Firebase Console-ban nem mindig szerkeszthető a beépített sablon
// (pl. Spark/ingyenes csomagon gyakran letiltott funkció), ezt a levelet mi
// magunk küldjük ki, saját dizájnnal - a linket a Firebase Admin SDK
// generálja (lásd api/send-password-reset-email.js), csak a KÉZBESÍTÉS
// történik a mi oldalunkon, Resend-en keresztül.
function buildPasswordResetHtml(email, resetLink) {
  const bodyRows =
    '<tr><td style="padding:32px 36px 6px 36px;">' +
      '<h1 style="font-family:' + FONT_HEADING + '; font-size:20px; color:' + COLOR_TEXT + '; margin:0 0 12px 0;">Jelszó visszaállítása</h1>' +
      '<p style="font-family:' + FONT_BODY + '; font-size:13.5px; line-height:1.65; color:#666666; margin:0 0 24px 0;">Kérelmet kaptunk a(z) <strong style="color:' + COLOR_TEXT + ';">' + escapeHtml(email) + '</strong> e-mail-fiókhoz tartozó jelszó visszaállítására. Az alábbi gombra kattintva biztonságosan beállíthat egy új jelszót.</p>' +
      ctaButton(resetLink, "Új jelszó beállítása") +
    "</td></tr>" +

    '<tr><td style="padding:20px 36px 0 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:12px; line-height:1.6; color:#aaaaaa; margin:0;">Ha a gomb nem működik, másolja be ezt a linket a böngészőjébe:<br>' +
        '<a href="' + resetLink + '" style="color:' + COLOR_ACCENT + '; word-break:break-all;">' + resetLink + '</a></p>' +
    "</td></tr>" +

    '<tr><td style="padding:20px 36px 30px 36px;">' +
      noteBox("Ha Ön nem kérte a jelszó visszaállítását, egyszerűen hagyja figyelmen kívül ezt az e-mailt - a fiókja biztonságban van, és a jelszava nem változik meg.") +
    "</td></tr>";

  return emailShell(bodyRows);
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

// ═══════════════════════════════════════════════════════════════════════
// 5) E-MAIL CÍM MEGERŐSÍTŐ E-MAIL (saját, márkázott sablon Resend-en keresztül)
// ═══════════════════════════════════════════════════════════════════════
function buildVerificationHtml(email, verifyLink) {
  const bodyRows =
    '<tr><td style="padding:32px 36px 6px 36px;">' +
      '<h1 style="font-family:' + FONT_HEADING + '; font-size:20px; color:' + COLOR_TEXT + '; margin:0 0 12px 0;">Erősítse meg az e-mail címét</h1>' +
      '<p style="font-family:' + FONT_BODY + '; font-size:13.5px; line-height:1.65; color:#666666; margin:0 0 24px 0;">Köszönjük a regisztrációt! A(z) <strong style="color:' + COLOR_TEXT + ';">' + escapeHtml(email) + '</strong> e-mail cím megerősítéséhez kattintson az alábbi gombra.</p>' +
      ctaButton(verifyLink, "E-mail cím megerősítése") +
    "</td></tr>" +

    '<tr><td style="padding:20px 36px 0 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:12px; line-height:1.6; color:#aaaaaa; margin:0;">Ha a gomb nem működik, másolja be ezt a linket a böngészőjébe:<br>' +
        '<a href="' + verifyLink + '" style="color:' + COLOR_ACCENT + '; word-break:break-all;">' + verifyLink + '</a></p>' +
    "</td></tr>" +

    '<tr><td style="padding:20px 36px 30px 36px;">' +
      noteBox("Ha Ön nem regisztrált nálunk, egyszerűen hagyja figyelmen kívül ezt az e-mailt.") +
    "</td></tr>";

  return emailShell(bodyRows);
}

async function sendVerificationEmailCustom(email, verifyLink) {
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!email || !verifyLink) {
    console.error("Hiányzó e-mail cím vagy megerősítő link - megerősítő e-mail kihagyva.");
    return;
  }

  await sendViaResend({
    from: fromEmail,
    to: [email],
    subject: "Erősítse meg az e-mail címét - Révai Fruit Kft.",
    html: buildVerificationHtml(email, verifyLink),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 6) ADMIN-ÉRTESÍTŐ E-MAIL ÚJ REGISZTRÁCIÓRÓL (belső, funkcionális levél,
//    "Jóváhagyás" gombbal - lásd api/approve-user.js)
// ═══════════════════════════════════════════════════════════════════════
function buildRegistrationAdminNotificationHtml(user, approveLink) {
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">' +
      '<h2 style="color:#ff7a18;margin-bottom:4px;">Új regisztráció érkezett</h2>' +
      '<p style="color:#999;margin-top:0;">Jóváhagyásra vár - az árak és a rendelés leadása addig nem érhető el ennek a felhasználónak.</p>' +

      '<table style="border-collapse:collapse;margin-top:14px;">' +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Cégnév</td><td style="padding:3px 0;"><strong>' + escapeHtml(user.companyName || "-") + '</strong></td></tr>' +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Adószám</td><td style="padding:3px 0;">' + escapeHtml(user.vatNumber || "-") + '</td></tr>' +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Kapcsolattartó</td><td style="padding:3px 0;">' + escapeHtml(user.name || "-") + '</td></tr>' +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">Telefon</td><td style="padding:3px 0;">' + escapeHtml(user.phone || "-") + '</td></tr>' +
        '<tr><td style="padding:3px 10px 3px 0;color:#666;">E-mail</td><td style="padding:3px 0;">' + escapeHtml(user.email || "-") + '</td></tr>' +
      '</table>' +

      '<div style="margin-top:26px;">' +
        (approveLink
          ? '<a href="' + approveLink + '" target="_blank" style="display:inline-block; padding:13px 32px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:6px; background-color:#ff7a18;">Fiók jóváhagyása</a>'
          : '<p style="color:#c0392b;font-size:13px;">Nincs beállítva ADMIN_APPROVE_SECRET vagy API_BASE_URL - a jóváhagyó gomb nem generálható. Hagyd jóvá kézzel a Firestore-ban.</p>') +
      '</div>' +
      '<p style="color:#999;font-size:12px;margin-top:16px;">A gombra kattintva a fiók azonnal jóváhagyásra kerül, és a felhasználó automatikus e-mail-értesítést kap róla. A jóváhagyó link egyszer használatos hatású (ismételt kattintásra csak megerősíti, hogy már jóvá van hagyva).</p>' +
    '</div>'
  );
}

async function sendRegistrationAdminNotificationEmail(user, approveLink) {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!notifyEmail) {
    console.error("Hiányzó NOTIFY_EMAIL környezeti változó - regisztrációs admin-értesítő kihagyva.");
    return;
  }

  await sendViaResend({
    from: fromEmail,
    to: [notifyEmail],
    subject: "Új regisztráció jóváhagyásra vár - " + (user.companyName || user.name || user.email || ""),
    html: buildRegistrationAdminNotificationHtml(user, approveLink),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 7) "FIÓK JÓVÁHAGYVA" E-MAIL (a vásárlónak, az admin jóváhagyása után)
// ═══════════════════════════════════════════════════════════════════════
function buildApprovalHtml(name) {
  const nameParts = (name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.length ? nameParts[nameParts.length - 1] : "";
  const shopLink = process.env.SHOP_URL || "https://revaifruitkft.hu";

  const bodyRows =
    '<tr><td style="padding:32px 36px 6px 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:11px; letter-spacing:1.2px; text-transform:uppercase; color:' + COLOR_ACCENT + '; font-weight:bold; margin:0 0 10px 0;">Fiók jóváhagyva</p>' +
      '<h1 style="font-family:' + FONT_HEADING + '; font-size:22px; color:' + COLOR_TEXT + '; margin:0 0 10px 0;">Készen áll' + (firstName ? ", " + escapeHtml(firstName) : "") + "!</h1>" +
      '<p style="font-family:' + FONT_BODY + '; font-size:13.5px; line-height:1.65; color:#666666; margin:0 0 22px 0;">Ellenőriztük és jóváhagytuk a céges fiókját. Mostantól bejelentkezve látja az áraikat, és bármikor leadhatja megrendelését.</p>' +
      ctaButton(shopLink, "Vásárlás megkezdése") +
    "</td></tr>" +

    '<tr><td style="padding:24px 36px 30px 36px;">' +
      '<p style="font-family:' + FONT_BODY + '; font-size:12.5px; line-height:1.6; color:' + COLOR_MUTED + '; margin:0;">Ha bármilyen kérdése van, keressen minket bizalommal. Jó vásárlást kívánunk!</p>' +
    "</td></tr>";

  return emailShell(bodyRows);
}

async function sendApprovalEmail(name, email) {
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!email) {
    console.error("Hiányzó e-mail cím - jóváhagyás-értesítő e-mail kihagyva.");
    return;
  }

  await sendViaResend({
    from: fromEmail,
    to: [email],
    subject: "Fiókja jóváhagyva - Révai Fruit Kft.",
    html: buildApprovalHtml(name),
  });
}

module.exports = {
  sendOrderNotificationEmail,
  sendCustomerOrderConfirmationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmailCustom,
  sendVerificationEmailCustom,
  sendRegistrationAdminNotificationEmail,
  sendApprovalEmail,
};
