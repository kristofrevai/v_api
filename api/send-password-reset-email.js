/**
 * Vercel Serverless Function - Jelszó-visszaállító e-mail küldése (saját sablonnal)
 * ────────────────────────────────────────────────────────────────────────
 * Miért van erre szükség, nem elég a Firebase beépített e-mail küldése?
 * A Firebase Console-ban sok projektnél (főleg ingyenes Spark csomagon)
 * nem szerkeszthető a beépített e-mail sablon márkázás céljából. Ez a
 * function megkerüli ezt: a Firebase Admin SDK-val (ami már amúgy is
 * használatban van a projektben, NEM igényel Blaze csomagot) legenerálja
 * a valódi, biztonságos jelszó-visszaállító linket, majd a mi saját,
 * márkázott sablonunkkal, a Resend-en keresztül küldjük ki az e-mailt.
 *
 * FONTOS: biztonsági okból (hogy ne lehessen kitalálni, mely e-mail címek
 * regisztráltak a rendszerben) MINDIG sikeres választ adunk vissza,
 * függetlenül attól, hogy létezik-e ilyen felhasználó.
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT - a Firebase service account JSON kulcs, EGY SORBAN
 *   RESEND_API_KEY            - a Resend fiókodból
 *   NOTIFY_FROM_EMAIL         - opcionális, a feladó cím
 */

const admin = require("firebase-admin");
const { sendPasswordResetEmailCustom } = require("../lib/email");

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
      const resetLink = await admin.auth().generatePasswordResetLink(email);
      await sendPasswordResetEmailCustom(email, resetLink);
    } catch (err) {
      // "user-not-found" esetén is sikeres választ adunk (account enumeration elleni védelem) -
      // egyéb hibákat logolunk, de a válaszunk kifelé ekkor is semleges marad.
      if (err.code !== "auth/user-not-found") {
        console.error("Jelszó-visszaállító link generálási hiba:", err);
      }
    }

    // Mindig sikeres választ adunk, függetlenül attól, hogy létezett-e a felhasználó.
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-password-reset-email hiba:", err);
    res.status(500).json({ error: "Belső szerverhiba." });
  }
};
