/**
 * Vercel Serverless Function - E-mail cím megerősítő e-mail küldése
 * ────────────────────────────────────────────────────────────────────────
 * A webshop.html a sikeres regisztráció után (illetve a "Megerősítő e-mail
 * újraküldése" gombra kattintva) hívja meg ezt a végpontot. A Firebase
 * Admin SDK-val generáljuk a valódi megerősítő linket, majd a saját,
 * márkázott sablonunkkal, a Resend-en keresztül küldjük ki.
 *
 * FONTOS - miért NEM a handleCodeInApp-ot használjuk:
 * Az admin.auth().generateEmailVerificationLink() "verifyEmail" módnál a
 * gyakorlatban (Firebase-oldali sajátosság) sokszor NEM ugorja át a saját,
 * generikus, firebaseapp.com/__/auth/action hosted oldalát, még
 * actionCodeSettings.handleCodeInApp:true mellett sem - helyette ott egy
 * "Tovább" linket ad a continueUrl-re. Emiatt ehelyett a megbízhatóbb
 * megoldást alkalmazzuk: a Firebase által generált linkből KINYERJÜK az
 * "oobCode"-ot, és ezzel MAGUNK építünk egy linket, ami közvetlenül a saját
 * verify-email.html oldalunkra mutat. A verify-email.html a kliensoldali
 * Firebase SDK-val (auth.applyActionCode(oobCode)) végzi el ténylegesen a
 * megerősítést - így a Firebase hosted oldala sosem jelenik meg, és nincs
 * szükség az "Authorized domains" listára sem ehhez a folyamathoz.
 *
 * Szükséges környezeti változók:
 *   FIREBASE_SERVICE_ACCOUNT - a Firebase service account JSON kulcs, EGY SORBAN
 *   RESEND_API_KEY            - a Resend fiókodból
 *   NOTIFY_FROM_EMAIL         - opcionális, a feladó cím
 *
 * FONTOS: a verify-email.html-t ki kell tenni a
 * https://revaifruitkft.hu/web/verify-email.html elérési útra (jelenleg egy
 * "web" nevű mappába).
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

// A Firebase által generált linkből (pl.
// https://xxx.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=ABC123&...)
// kinyeri az oobCode paramétert, és egy, a saját oldalunkra mutató, egyenes
// linket épít belőle.
function buildDirectVerifyLink(firebaseGeneratedLink) {
  const parsed = new URL(firebaseGeneratedLink);
  const oobCode = parsed.searchParams.get("oobCode");
  if (!oobCode) {
    throw new Error("Nem sikerült kinyerni az oobCode-ot a Firebase által generált linkből.");
  }
  const directUrl = new URL(VERIFY_EMAIL_ACTION_URL);
  directUrl.searchParams.set("mode", "verifyEmail");
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
      const firebaseGeneratedLink = await admin.auth().generateEmailVerificationLink(email);
      const verifyLink = buildDirectVerifyLink(firebaseGeneratedLink);
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
