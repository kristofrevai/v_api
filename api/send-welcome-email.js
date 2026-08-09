/**
 * Vercel Serverless Function - Üdvözlő e-mail küldése regisztrációkor,
 * ÉS admin-értesítés az új regisztrációról (jóváhagyó linkkel)
 * ────────────────────────────────────────────────────────────────────────
 * A webshop.html a sikeres Firebase regisztráció után hívja meg ezt a
 * végpontot. Két e-mail megy el innen:
 *   1) a felhasználónak egy üdvözlő e-mail (mint eddig)
 *   2) a boltvezetőnek (NOTIFY_EMAIL) egy admin-értesítő, benne a cég
 *      adataival és egy "Fiók jóváhagyása" gombbal - lásd api/approve-user.js
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   RESEND_API_KEY            - a Resend fiókodból (resend.com)
 *   NOTIFY_EMAIL               - a boltvezető e-mail címe (ide megy az admin-értesítő)
 *   NOTIFY_FROM_EMAIL          - opcionális, a feladó cím (alapértelmezett: Resend teszt domain)
 *   FIREBASE_SERVICE_ACCOUNT  - a Firebase service account JSON kulcs, EGY SORBAN
 *   ADMIN_APPROVE_SECRET       - hosszú, véletlenszerű titok a jóváhagyó linkhez (lásd api/approve-user.js)
 *   API_BASE_URL                - ennek az API-nak a nyilvános URL-je (pl. "https://v-api-phi.vercel.app"),
 *                                 a jóváhagyó link összeállításához
 */
const admin = require("firebase-admin");
const { sendWelcomeEmail, sendRegistrationAdminNotificationEmail } = require("../lib/email");
const { applyCors, checkAndSetEmailCooldown } = require("../lib/security");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Ugyanarra az e-mail címre max. ennyi másodpercenként küldünk üdvözlő
// e-mailt - ez akadályozza meg, hogy valaki ezt a végpontot közvetlenül
// hívogatva (a tényleges regisztrációt megkerülve) tömegesen spam-elje
// ugyanazt a postaládát. Ugyanez a cooldown védi az admin-értesítőt is,
// csak külön kulccsal (uid alapján), hogy egy regisztrációról biztosan
// csak EGY admin-e-mail menjen el, akárhányszor hívódna is meg a végpont.
const COOLDOWN_SECONDS = 60;

function buildApproveLink(uid) {
  const secret = process.env.ADMIN_APPROVE_SECRET;
  const apiBase = process.env.API_BASE_URL;
  if (!secret || !apiBase || !uid) return null;
  return apiBase.replace(/\/$/, "") + "/api/approve-user?uid=" + encodeURIComponent(uid) + "&secret=" + encodeURIComponent(secret);
}

module.exports = async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const { name, email, accountType, uid, companyName, vatNumber, phone } = req.body || {};
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Hiányzó e-mail cím." });
      return;
    }

    // ── 1) Üdvözlő e-mail a felhasználónak (mint eddig) ──
    const canSendWelcome = await checkAndSetEmailCooldown(db, "welcome", email, COOLDOWN_SECONDS);
    if (canSendWelcome) {
      await sendWelcomeEmail(name || "", email, accountType || "private");
    }

    // ── 2) Admin-értesítő a boltvezetőnek, jóváhagyó linkkel ──
    // Csak akkor van értelme, ha van uid-unk (a Firestore user-dokumentum
    // azonosítója) - enélkül nem tudnánk hova írni a jóváhagyást.
    if (uid) {
      const canNotifyAdmin = await checkAndSetEmailCooldown(db, "admin-new-registration", uid, COOLDOWN_SECONDS);
      if (canNotifyAdmin) {
        const approveLink = buildApproveLink(uid);
        await sendRegistrationAdminNotificationEmail(
          { name: name || "", email: email, companyName: companyName || "", vatNumber: vatNumber || "", phone: phone || "" },
          approveLink
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-welcome-email hiba:", err);
    // Ez egy másodlagos, nem kritikus funkció - a kliens úgyis fire-and-forget
    // módon hívja, de azért adjunk vissza egy értelmes hibát, ha valaki
    // közvetlenül tesztelné az endpointot.
    res.status(500).json({ error: "Belső szerverhiba az üdvözlő/admin-értesítő e-mail küldésekor." });
  }
};
