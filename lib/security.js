/**
 * Közös biztonsági segédfüggvények, amiket a nyilvános (bejelentkezés
 * nélkül is hívható) e-mail-küldő API végpontok használnak:
 *
 *  1) applyCors()                - csak a saját domainről engedi böngészőből
 *                                   meghívni a végpontot
 *  2) checkAndSetEmailCooldown() - ugyanarra az e-mail címre nem lehet
 *                                   túl gyakran (túl sokszor egymás után)
 *                                   e-mailt küldetni ugyanazon a végponton
 *
 * Miért kell ez: a megerősítő/jelszó-visszaállító/üdvözlő e-mailt küldő
 * végpontok szándékosan bejelentkezés NÉLKÜL hívhatók (hiszen pl. jelszó-
 * visszaállításkor még nincs bejelentkezve a felhasználó) - enélkül bárki,
 * aki ismeri a végpont URL-jét, tömegesen küldethetne e-maileket akár a
 * saját, akár mások postaládájába, ami spam-nek hat és/vagy elhasználja az
 * e-mail-küldési keretet (Resend).
 */

// Engedélyezett origin-ek (böngészős, cross-origin hívásokhoz). Vesszővel
// elválasztva bővíthető az ALLOWED_ORIGINS környezeti változóval (pl. helyi
// teszteléshez, "http://localhost:5500" stb.) - enélkül csak az éles domain
// van engedélyezve.
const DEFAULT_ALLOWED_ORIGINS = ["https://revaifruitkft.hu"];

function getAllowedOrigins() {
  const extra = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
  return DEFAULT_ALLOWED_ORIGINS.concat(extra);
}

/**
 * Beállítja a CORS fejléceket a kérés Origin-je alapján. Ha az Origin nem
 * szerepel az engedélyezett listában, NEM állítjuk be az
 * Access-Control-Allow-Origin fejlécet - ez böngészőből megakadályozza,
 * hogy IDEGEN weboldalak (más domainek) meghívhassák ezt a végpontot a
 * látogatóid böngészőjén keresztül.
 *
 * FONTOS KORLÁT: ez kizárólag böngészős, cross-origin hívások ellen véd.
 * Egy parancssori scriptet vagy szervert (ami nem böngészőből hív) a CORS
 * önmagában NEM állít meg - emiatt kell mellé a cooldown-ellenőrzés is.
 */
function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowed = getAllowedOrigins();
  if (origin && allowed.indexOf(origin) !== -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Jelezzük a cache-eknek/proxyknak, hogy a válasz az Origin fejléctől függ.
  res.setHeader("Vary", "Origin");
}

/**
 * E-mail-küldési "hűtési idő" ellenőrzése és beállítása egy Firestore
 * kollekcióban ("rateLimits"). Ha ugyanarra a (type, email) párra a
 * megadott cooldownSeconds időn belül már történt küldés, `false`-t ad
 * vissza - ilyenkor a hívó kódnak NEM szabad újabb e-mailt küldenie
 * (de a kliens felé ekkor is semleges, sikeres választ kell adni, hogy ne
 * áruljuk el, létezik-e az adott e-mail cím a rendszerben).
 *
 * Ha a cooldown letelt (vagy még sosem küldtünk erre a címre), frissíti az
 * időbélyeget, és `true`-t ad vissza - ilyenkor mehet a tényleges küldés.
 */
async function checkAndSetEmailCooldown(db, type, email, cooldownSeconds) {
  const key = type + ":" + String(email).trim().toLowerCase();
  const ref = db.collection("rateLimits").doc(key);
  const now = Date.now();

  const doc = await ref.get();
  if (doc.exists) {
    const lastSentAt = doc.data().lastSentAt;
    if (typeof lastSentAt === "number" && (now - lastSentAt) < cooldownSeconds * 1000) {
      return false;
    }
  }
  await ref.set({ lastSentAt: now }, { merge: true });
  return true;
}

module.exports = { applyCors, checkAndSetEmailCooldown };
