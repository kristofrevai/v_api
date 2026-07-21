/**
 * Vercel Serverless Function - E-mail cím megerősítő e-mail küldése
 * ────────────────────────────────────────────────────────────────────────
 * A webshop.html a sikeres regisztráció után (illetve a "Megerősítő e-mail
 * újraküldése" gombra kattintva) hívja meg ezt a végpontot. A Firebase
 * Admin SDK-val generáljuk a valódi megerősítő linket, majd a saját,
 * márkázott sablonunkkal, a Resend-en keresztül küldjük ki.
 *
 * Szükséges környezeti változók:
 *   FIREBASE_SERVICE_ACCOUNT - a Firebase service account JSON kulcs, EGY SORBAN
 *   RESEND_API_KEY            - a Resend fiókodból
 *   NOTIFY_FROM_EMAIL         - opcionális, a feladó cím
 */

const admin = require("firebase-admin");
const { sendVerificationEmailCustom } = require("../lib/email");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Hiányzó e-mail cím." });
      return;
    }

    try {
      const verifyLink = await admin.auth().generateEmailVerificationLink(email);
      await sendVerificationEmailCustom(email, verifyLink);
    } catch (err) {
      console.error("Megerősítő link generálási hiba:", err);
      // Nem áruljuk el kifelé a pontos hibát (pl. hogy nincs ilyen felhasználó) - mindig semleges választ adunk.
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-verification-email hiba:", err);
    res.status(500).json({ error: "Belső szerverhiba." });
  }
};
