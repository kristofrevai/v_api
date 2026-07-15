/**
 * Rendelés-értesítő e-mail küldése a boltvezetőnek, a Resend API-n keresztül.
 * ────────────────────────────────────────────────────────────────────────
 * Az e-mail tartalmaz egy táblázatot a rendelt tételekről (Megnevezés /
 * Kiszerelés / Mennyiség oszlopokkal), fölötte egy egyesített, középre
 * igazított cellában a megrendelő nevével. Emellett egy valódi Excel
 * (.xlsx) fájl is csatolásra kerül, ugyanezzel a felépítéssel (egyesített,
 * középre igazított névfejléc + 3 oszlop) - ezt közvetlenül meg lehet
 * nyitni és nyomtatni Excelben.
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   RESEND_API_KEY     - a Resend fiókodból (resend.com)
 *   NOTIFY_EMAIL        - ide (a boltvezető e-mail címére) érkeznek az értesítések
 *   NOTIFY_FROM_EMAIL   - opcionális, a feladó cím (alapértelmezett: Resend teszt domain)
 */

const ExcelJS = require("exceljs");

function escapeHtml(str) {
  return String(str === undefined || str === null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function customerDisplayName(order) {
  const c = order.customer || {};
  return c.cegnev || c.nev || "Vásárló";
}

// Valódi Excel (.xlsx) fájl felépítése: A1:C1 egyesítve, középre igazítva a
// megrendelő nevével, alatta a Megnevezés / Kiszerelés / Mennyiség oszlopok.
async function buildXlsxBuffer(order) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Rendelés");

  sheet.columns = [
    { width: 34 },
    { width: 20 },
    { width: 14 },
  ];

  sheet.mergeCells("A1:C1");
  const nameCell = sheet.getCell("A1");
  nameCell.value = customerDisplayName(order);
  nameCell.alignment = { horizontal: "center", vertical: "middle" };
  nameCell.font = { bold: true, size: 13 };
  sheet.getRow(1).height = 24;

  const headerRow = sheet.addRow(["Megnevezés", "Kiszerelés", "Mennyiség"]);
  headerRow.eachCell(function (cell) {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3E6" } };
  });

  (order.items || []).forEach(function (it) {
    const row = sheet.addRow([it.name, it.unit, it.qty]);
    row.getCell(3).alignment = { horizontal: "center" };
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
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

      '<p style="color:#999;font-size:12px;margin-top:20px;">A csatolt Excel (.xlsx) fájl közvetlenül megnyitható és nyomtatható - a megrendelő neve egyesített, középre igazított fejléccellában szerepel a táblázat fölött.</p>' +
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

  const xlsxBuffer = await buildXlsxBuffer(order);
  const xlsxBase64 = xlsxBuffer.toString("base64");
  const paymentLabel = order.paymentMethod === "cod" ? "Utánvét" : "Bankkártya";

  const payload = {
    from: fromEmail,
    to: [notifyEmail],
    subject: "Új rendelés (" + paymentLabel + ") - #" + orderId,
    html: buildHtml(order, orderId),
    attachments: [
      { filename: "rendeles_" + orderId + ".xlsx", content: xlsxBase64 },
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
