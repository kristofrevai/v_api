/**
 * Vercel Serverless Function - E-mail cím megerősítő e-mail küldése
 * ────────────────────────────────────────────────────────────────────────
 * A webshop.html a sikeres regisztráció után (illetve a "Megerősítő e-mail
 * újraküldése" gombra kattintva) hívja meg ezt a végpontot. A Firebase
 * Admin SDK-val generáljuk a valódi megerősítő linket, majd a saját,
 * márkázott sablonunkkal, a Resend-en keresztül küldjük ki.
 *
 * A megerősítő link a saját, márkázott verify-email.html oldalunkra mutat
 * (handleCodeInApp: true), NEM a Firebase alapértelmezett, generikus
 * action-handler oldalára - a tényleges megerősítést (applyActionCode) a
 * verify-email.html végzi el, kliensoldalon.
 *
 * Szükséges környezeti változók:
 *   FIREBASE_SERVICE_ACCOUNT - a Firebase service account JSON kulcs, EGY SORBAN
 *   RESEND_API_KEY            - a Resend fiókodból
 *   NOTIFY_FROM_EMAIL         - opcionális, a feladó cím
 *
 * FONTOS: a verify-email.html-t ki kell tenni a
 * https://revaifruitkft.hu/web/verify-email.html elérési útra (jelenleg egy
 * "web" nevű mappába), ÉS a revaifruitkft.hu domaint fel kell venni a
 * Firebase Console → Authentication → Settings → Authorized domains
 * listájába (különben a link generálása vagy a beváltása hibát fog adni).
 */
const admin = require("firebase-admin");
const { sendVerificationEmailCustom } = require("../lib/email");
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// A saját, márkázott megerősítő oldalunk - lásd verify-email.html.
// FONTOS: ennek pontosan meg kell egyeznie azzal az elérési úttal, ahova a
// verify-email.html ténylegesen fel van töltve a revaifruitkft.hu domainen.
const VERIFY_EMAIL_ACTION_URL = "https://revaifruitkft.hu/web/verify-email.html";

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
      const actionCodeSettings = {
        url: VERIFY_EMAIL_ACTION_URL,
        handleCodeInApp: true,
      };
      const verifyLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
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
