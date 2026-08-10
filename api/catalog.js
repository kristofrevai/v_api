/**
 * Vercel Serverless Function - a termékkatalógus kiadása JSON-ban.
 *
 * FONTOS: az ÁRAKAT kizárólag bejelentkezett ÉS jóváhagyott (status === "approved")
 * fióknak adjuk ki. Vendégként / jóváhagyásra váró fiókként a termékek neve,
 * képe és kiszerelés-címkéi továbbra is elérhetők (böngészhető katalógus),
 * de ár nélkül - így az árlista F12-vel, a Network fülön vagy a végpont
 * közvetlen meghívásával sem szedhető ki.
 */
const admin = require("firebase-admin");
const { CATALOG } = require("../lib/catalog");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

/**
 * Ár nélküli katalógus-változat. A `price` mezőt kivesszük az itemekből,
 * az `options` tömbökből pedig csak a `label` marad meg (a `price` nem).
 * Minden más (id, name, img, unit, minQty, qtyStep) változatlan.
 */
function stripPrices(catalog) {
  return catalog.map(function (cat) {
    return {
      id: cat.id,
      label: cat.label,
      groups: cat.groups.map(function (grp) {
        return {
          label: grp.label,
          items: grp.items.map(function (item) {
            const safe = {};
            Object.keys(item).forEach(function (key) {
              if (key === "price" || key === "options") return;
              safe[key] = item[key];
            });
            if (item.options && item.options.length) {
              safe.options = item.options.map(function (o) { return { label: o.label }; });
            }
            return safe;
          })
        };
      })
    };
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  // Az Authorization fejléc miatt a böngésző preflight (OPTIONS) kérést küld -
  // ezt kifejezetten engedélyezni kell, különben a kérés el sem indul.
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  // KRITIKUS: a választ SOHA nem szabad megosztott cache-be engedni, különben
  // egy jóváhagyott felhasználó áras válaszát a CDN kiszolgálhatná vendégnek is.
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Authorization");

  let approved = false;
  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (idToken) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const userDoc = await db.collection("users").doc(decoded.uid).get();
      approved = userDoc.exists && userDoc.data().status === "approved";
    } catch (err) {
      // Lejárt/hibás token: nem hiba, egyszerűen vendégként kezeljük.
      console.error("Katalógus token-ellenőrzés:", err.message);
      approved = false;
    }
  }

  res.status(200).json({
    catalog: approved ? CATALOG : stripPrices(CATALOG),
    pricesIncluded: approved
  });
};
