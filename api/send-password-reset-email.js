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
 * FONTOS - miért NEM közvetlenül a Firebase által generált linket küldjük:
 * A Firebase által generált link a saját, generikus, firebaseapp.com hosted
 * oldalára mutat (ugyanaz a jelenség, mint az e-mail megerősítésnél volt).
 * Ehelyett a generált linkből KINYERJÜK az "oobCode"-ot, és MAGUNK építünk
 * egy linket, ami közvetlenül a saját reset-password.html oldalunkra mutat.
 * Az oldal a kliensoldali Firebase SDK-val (verifyPasswordResetCode +
 * confirmPasswordReset) végzi el ténylegesen a jelszócserét - így a
 * Firebase hosted oldala sosem jelenik meg.
 *
 * FONTOS: biztonsági okból (hogy ne lehessen kitalálni, mely e-mail címek
 * regisztráltak a rendszerben) MINDIG sikeres választ adunk vissza,
 * függetlenül attól, hogy létezik-e ilyen felhasználó.
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT - a Firebase service account JSON kulcs, EGY SORBAN
 *   RESEND_API_KEY            - a Resend fiókodból
 *   NOTIFY_FROM_EMAIL         - opcionális, a feladó cím
 *
 * FONTOS: a reset-password.html-t ki kell tenni a
 * https://revaifruitkft.hu/web/reset-password.html elérési útra (ugyanabba
 * a "web" mappába, ahova a verify-email.html is került).
 */
const admin = require("firebase-admin");
const { sendPasswordResetEmailCustom } = require("../lib/email");
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// A saját, márkázott jelszó-visszaállító oldalunk - lásd reset-password.html.
// FONTOS: ennek pontosan meg kell egyeznie azzal az elérési úttal, ahova a
// reset-password.html ténylegesen fel van töltve a revaifruitkft.hu domainen.
const RESET_PASSWORD_ACTION_URL = "https://revaifruitkft.hu/web/reset-password.html";

// A Firebase által generált linkből (pl.
// https://xxx.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC123&...)
// kinyeri az oobCode paramétert, és egy, a saját oldalunkra mutató, egyenes
// linket épít belőle.
function buildDirectResetLink(firebaseGeneratedLink) {
  const parsed = new URL(firebaseGeneratedLink);
  const oobCode = parsed.searchParams.get("oobCode");
  if (!oobCode) {
    throw new Error("Nem sikerült kinyerni az oobCode-ot a Firebase által generált linkből.");
  }
  const directUrl = new URL(RESET_PASSWORD_ACTION_URL);
  directUrl.searchParams.set("mode", "resetPassword");
  directUrl.searchParams.set("oobCode", oobCode);
  return directUrl.toString();
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
      const firebaseGeneratedLink = await admin.auth().generatePasswordResetLink(email);
      const resetLink = buildDirectResetLink(firebaseGeneratedLink);
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
