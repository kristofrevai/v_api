/**
 * Vercel Serverless Function - Regisztráció jóváhagyása
 * ────────────────────────────────────────────────────────────────────────
 * EZ EGY GET VÉGPONT (nem POST), mert közvetlenül egy e-mailben kapott
 * linkre kattintva, böngészőből kell működnie - a regisztrációs
 * admin-értesítő e-mail (lásd lib/email.js -> buildRegistrationAdminNotificationHtml)
 * egy "Fiók jóváhagyása" gombot tartalmaz, ami erre a végpontra mutat.
 *
 * VÉDELEM: nincs Firebase bejelentkezés/admin-jogosultsági rendszer az
 * oldalon, ezért egy egyszerű, hosszú, véletlenszerű "secret" query
 * paraméterrel védjük - ezt csak Te ismered (illetve az e-mail, amit
 * kapsz), és csak a Vercel környezeti változóban van eltárolva.
 *
 * MŰKÖDÉS:
 *   GET /api/approve-user?uid=<firebase uid>&secret=<ADMIN_APPROVE_SECRET>
 *   - ha a secret helyes: a users/{uid} Firestore-dokumentum `status`
 *     mezőjét 'approved'-ra állítja (Admin SDK-val, ami MEGKERÜLI a
 *     Firestore Security Rules kliens-oldali korlátozását - ez itt
 *     szándékos és biztonságos, mert ez szerveroldali, titkosított kód)
 *   - elküldi a felhasználónak a "Fiókja jóváhagyva" e-mailt
 *   - egy egyszerű, olvasható visszaigazoló HTML oldalt jelenít meg
 *     (nem JSON-t, mert böngészőben, közvetlenül a linkre kattintva nyílik meg)
 *
 * Szükséges környezeti változók:
 *   ADMIN_APPROVE_SECRET       - hosszú, véletlenszerű titok (Te választod - lásd lent)
 *   FIREBASE_SERVICE_ACCOUNT  - Firebase service account JSON, egy sorban
 *   SHOP_URL                    - opcionális, a "Fiókja jóváhagyva" e-mail CTA gombjához
 *
 * Az ADMIN_APPROVE_SECRET generálásához pl.:
 *   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
 */
const admin = require("firebase-admin");
const { sendApprovalEmail } = require("../lib/email");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

function htmlPage(title, message, isError) {
  const color = isError ? "#c0392b" : "#1e8449";
  return (
    "<!DOCTYPE html><html lang=\"hu\"><head><meta charset=\"utf-8\">" +
    "<title>" + title + "</title>" +
    "<style>" +
      "body{font-family:Arial,Helvetica,sans-serif;background:#f6f4f1;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box;}" +
      ".box{background:#fff;border:1px solid #ececec;border-radius:10px;padding:40px 44px;max-width:440px;text-align:center;}" +
      "h1{font-size:18px;color:" + color + ";margin-bottom:10px;}" +
      "p{color:#555;font-size:14px;line-height:1.6;margin:0;}" +
    "</style>" +
    "</head><body><div class=\"box\"><h1>" + title + "</h1><p>" + message + "</p></div></body></html>"
  );
}

function escapeHtml(str) {
  return String(str === undefined || str === null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

module.exports = async (req, res) => {
  if (req.method !== "GET") { res.status(405).send("Method not allowed"); return; }

  const { uid, secret } = req.query || {};
  const expectedSecret = process.env.ADMIN_APPROVE_SECRET;

  if (!expectedSecret) {
    res.status(500).send(htmlPage("Hiányzó beállítás", "Nincs beállítva ADMIN_APPROVE_SECRET környezeti változó a szerveren.", true));
    return;
  }
  if (!secret || secret !== expectedSecret) {
    res.status(403).send(htmlPage("Hozzáférés megtagadva", "Érvénytelen vagy hiányzó jóváhagyási kulcs.", true));
    return;
  }
  if (!uid || typeof uid !== "string") {
    res.status(400).send(htmlPage("Hiányzó azonosító", "Nincs megadva felhasználó-azonosító (uid) a linkben.", true));
    return;
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).send(htmlPage("Nem található", "Ez a felhasználói fiók nem létezik (törölve lett?).", true));
      return;
    }

    const data = userDoc.data();
    const displayLabel = data.companyName || data.name || data.email || uid;

    if (data.status === "approved") {
      res.status(200).send(htmlPage("Már jóváhagyva", "A(z) " + escapeHtml(displayLabel) + " fiók már korábban jóvá lett hagyva - nincs teendő."));
      return;
    }

    // FONTOS: az Admin SDK-val végzett írás MEGKERÜLI a Firestore Security
    // Rules-t (ami a kliensnek megtiltja a status mező módosítását) - ez itt
    // szándékos, hiszen ez a kód kizárólag a szerveren, egy titkos kulccsal
    // védve fut, nem a böngészőből érkezik.
    await userRef.set({ status: "approved" }, { merge: true });

    try {
      await sendApprovalEmail(data.name, data.email);
    } catch (emailErr) {
      console.error("Jóváhagyás-értesítő e-mail hiba:", emailErr);
      // Az e-mail sikertelensége ne akadályozza meg, hogy a jóváhagyás
      // ténye visszaigazolásra kerüljön - a fiók már jóvá lett hagyva.
    }

    res.status(200).send(htmlPage("Jóváhagyva!", "A(z) " + escapeHtml(displayLabel) + " fiók sikeresen jóváhagyva. A felhasználó automatikus e-mail-értesítést kapott róla."));
  } catch (err) {
    console.error("approve-user hiba:", err);
    res.status(500).send(htmlPage("Hiba történt", "Belső szerverhiba a jóváhagyás során. Próbáld újra, vagy hagyd jóvá kézzel a Firestore-ban.", true));
  }
};
