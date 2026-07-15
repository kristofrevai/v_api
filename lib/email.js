/**
 * Rendelés-értesítő e-mail küldése a boltvezetőnek, a Resend API-n keresztül.
 * ────────────────────────────────────────────────────────────────────────
 * Az e-mail tartalmaz egy jól formázott HTML táblázatot (Megnevezés /
 * Kiszerelés / Mennyiség / Egységár / Összesen oszlopokkal, a megrendelő
 * adataival együtt) - ez a táblázat kijelölve és Excelbe másolva
 * automatikusan rendes oszlopokra bomlik. Emellett egy CSV fájl is
 * csatolásra kerül, amit közvetlenül meg lehet nyitni Excelben.
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   RESEND_API_KEY     - a Resend fiókodból (resend.com)
 *   NOTIFY_EMAIL        - ide (a boltvezető e-mail címére) érkeznek az értesítések
 *   NOTIFY_FROM_EMAIL   - opcionális, a feladó cím (alapértelmezett: Resend teszt domain)
 */

function escapeHtml(str) {
  return String(str === undefined || str === null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function formatFt(n) {
  return (Number(n) || 0).toLocaleString("hu-HU") + " Ft";
}

// CSV mezők idézőjelezése, ha vessző/idézőjel/sortörés van bennük.
function csvField(value) {
  const s = String(value === undefined || value === null ? "" : value);
  if (/[;"\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(order) {
  const rows = [["Megnevezés", "Kiszerelés", "Mennyiség", "Egységár (bruttó, Ft)", "Sor összesen (bruttó, Ft)"]];
  (order.items || []).forEach(function (it) {
    const lineTotal = (Number(it.unitPrice) || 0) * (Number(it.qty) || 0);
    rows.push([it.name, it.unit, it.qty, it.unitPrice, lineTotal]);
  });
  return rows.map(function (r) { return r.map(csvField).join(";"); }).join("\r\n");
}

function buildHtml(order, orderId) {
  const c = order.customer || {};
  const itemsRows = (order.items || []).map(function (it) {
    const lineTotal = (Number(it.unitPrice) || 0) * (Number(it.qty) || 0);
    return (
      "<tr>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;">' + escapeHtml(it.name) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;">' + escapeHtml(it.unit) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">' + escapeHtml(it.qty) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">' + formatFt(it.unitPrice) + "</td>" +
      '<td style="padding:6px 10px;border:1px solid #ddd;text-align:right;">' + formatFt(lineTotal) + "</td>" +
      "</tr>"
    );
  }).join("");

  const grandTotal = (order.items || []).reduce(function (sum, it) {
    return sum + (Number(it.unitPrice) || 0) * (Number(it.qty) || 0);
  }, 0);

  const paymentLabel = order.paymentMethod === "cod" ? "Utánvét" : "Bankkártya (SimplePay)";

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

      '<h3 style="border-bottom:1px solid #eee;padding-bottom:6px;margin-top:24px;">Rendelt tételek</h3>' +
      '<table style="border-collapse:collapse;width:100%;">' +
        "<thead><tr style=\"background:#fff3e6;\">" +
          '<th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Megnevezés</th>' +
          '<th style="padding:6px 10px;border:1px solid #ddd;text-align:left;">Kiszerelés</th>' +
          '<th style="padding:6px 10px;border:1px solid #ddd;text-align:center;">Mennyiség</th>' +
          '<th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">Egységár</th>' +
          '<th style="padding:6px 10px;border:1px solid #ddd;text-align:right;">Összesen</th>' +
        "</tr></thead>" +
        "<tbody>" + itemsRows + "</tbody>" +
        "<tfoot><tr>" +
          '<td colspan="4" style="padding:8px 10px;text-align:right;font-weight:bold;">Bruttó végösszeg:</td>' +
          '<td style="padding:8px 10px;text-align:right;font-weight:bold;">' + formatFt(grandTotal) + "</td>" +
        "</tr></tfoot>" +
      "</table>" +

      '<p style="color:#999;font-size:12px;margin-top:20px;">A táblázatot kijelölve és Excelbe/Word-be másolva automatikusan rendes oszlopokra bomlik. A csatolt CSV fájl közvetlenül is megnyitható Excelben.</p>' +
    "</div>"
  );
}

async function sendOrderNotificationEmail(order, orderId) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL || "Révai Fruit Webshop <onboarding@resend.dev>";

  if (!apiKey || !notifyEmail) {
    console.error("Hiányzó RESEND_API_KEY vagy NOTIFY_EMAIL környezeti változó - értesítő e-mail kihagyva.");
    return;
  }

  const csvContent = buildCsv(order);
  const csvBase64 = Buffer.from(csvContent, "utf8").toString("base64");
  const paymentLabel = order.paymentMethod === "cod" ? "Utánvét" : "Bankkártya";

  const payload = {
    from: fromEmail,
    to: [notifyEmail],
    subject: "Új rendelés (" + paymentLabel + ") - #" + orderId,
    html: buildHtml(order, orderId),
    attachments: [
      { filename: "rendeles_" + orderId + ".csv", content: csvBase64 },
    ],
  };

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

module.exports = { sendOrderNotificationEmail };
