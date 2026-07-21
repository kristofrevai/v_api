

const Stripe = require("stripe");
const admin = require("firebase-admin");
const { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } = require("../lib/email");
const { getVatRate, findItem } = require("../lib/catalog");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Csak ezekre a hétköznapokra engedünk szállítási napot (0=vasárnap...6=szombat; hétfő=1, szerda=3, péntek=5)
const ALLOWED_DELIVERY_WEEKDAYS = [1, 3, 5];

function isValidDeliveryDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return false;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d.getTime() < today.getTime()) return false;
  return ALLOWED_DELIVERY_WEEKDAYS.indexOf(d.getDay()) !== -1;
}

// Nettó árból bruttó ár, kerekítve a legközelebbi forintra - ugyanaz a logika, mint a kliensen.
function toGross(netPrice, vatRate) {
  return Math.round((Number(netPrice) || 0) * (1 + vatRate / 100));
}

/**
 * A kliens által küldött tételeket (csak pid + qty + opcionális optionLabel)
 * a SAJÁT katalógusunk alapján valódi, megbízható tételekké alakítjuk.
 * Minden árat/ÁFA-t itt számolunk ki - a kliens semmilyen ár- vagy
 * ÁFA-adatát nem használjuk fel.
 *
 * @returns {{ lineItems: Array, grossTotal: number } | { error: string }}
 */
function buildTrustedLineItems(rawItems) {
  const lineItems = [];
  let grossTotal = 0;

  for (const raw of rawItems) {
    const pid = raw && raw.pid;
    if (!pid || typeof pid !== "string") {
      return { error: "Hiányzó termékazonosító (pid) egy tételnél." };
    }

    const found = findItem(pid);
    if (!found) {
      return { error: `Ismeretlen termék: ${pid}` };
    }

    const product = found.item;
    const vatRate = getVatRate(found.catId);

    // Kiszerelés/ár kiválasztása: ha a terméknek van "options" listája
    // (pl. savanyúságok, kiszerelés-választós szárazáruk), a kliens által
    // küldött optionLabel alapján keressük ki az árat - ha nincs ilyen
    // option, elutasítjuk (nem hagyatkozunk semmilyen kliens-oldali árra).
    let unit, netUnitPrice;
    if (product.options && product.options.length) {
      const chosenLabel = raw.optionLabel;
      const opt = product.options.find((o) => o.label === chosenLabel);
      if (!opt) {
        return { error: `Érvénytelen kiszerelés a(z) "${product.name}" termékhez.` };
      }
      unit = opt.label;
      netUnitPrice = opt.price;
    } else {
      unit = product.unit;
      netUnitPrice = product.price;
    }

    // Mennyiség: legalább 1, egész szám, majd a termék minimumához/lépésközéhez igazítva.
    let qty = Math.max(1, Math.floor(Number(raw.qty) || 1));
    const minQty = product.minQty || 1;
    const qtyStep = product.qtyStep || 1;
    if (qty < minQty) qty = minQty;
    if (qtyStep > 1) {
      const stepsAboveMin = Math.round((qty - minQty) / qtyStep);
      qty = minQty + Math.max(0, stepsAboveMin) * qtyStep;
    }

    const grossUnitPrice = toGross(netUnitPrice, vatRate);
    const grossLineTotal = grossUnitPrice * qty;
    grossTotal += grossLineTotal;

    lineItems.push({
      pid,
      name: product.name,
      unit,
      qty,
      unitPrice: grossUnitPrice,   // bruttó - ez alapján terhel a Stripe
      netUnitPrice,
      vatRate,
    });
  }

  return { lineItems, grossTotal };
}

module.exports = async (req, res) => {
  // CORS - engedjük, hogy a webshop.html (bármelyik domainről) hívhassa
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    // ─── 1) Bejelentkezés ellenőrzése: Firebase ID token, NEM a kliens által küldött userId ───
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!idToken) {
      res.status(401).json({ error: "A rendelés leadásához bejelentkezés szükséges." });
      return;
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (tokenErr) {
      console.error("ID token ellenőrzési hiba:", tokenErr);
      res.status(401).json({ error: "A bejelentkezés lejárt vagy érvénytelen. Kérjük, jelentkezzen be újra." });
      return;
    }
    const userId = decodedToken.uid;

    const { customer, invoice, items, paymentMethod, deliveryDate } = req.body || {};

    if (!customer || !customer.email || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Hiányzó vagy hibás adatok (customer/items)." });
      return;
    }

    if (!isValidDeliveryDate(deliveryDate)) {
      res.status(400).json({ error: "Érvénytelen szállítási nap. Csak hétfő, szerda vagy péntek választható, jövőbeli dátummal." });
      return;
    }

    // ─── 2) Tételek és árak kizárólag a szerveroldali katalógusból ───
    const trusted = buildTrustedLineItems(items);
    if (trusted.error) {
      res.status(400).json({ error: trusted.error });
      return;
    }
    const { lineItems, grossTotal } = trusted;

    const MIN_ORDER_TOTAL = 20000;
    if (grossTotal < MIN_ORDER_TOTAL) {
      res.status(400).json({ error: "A minimumrendelési érték 20 000 Ft (bruttó)." });
      return;
    }

    const isCod = paymentMethod === "cod";

    // Stripe line_items a megbízható, szerveroldali árak alapján.
    const stripeLineItems = lineItems.map((it) => ({
      price_data: {
        currency: "huf",
        product_data: { name: `${it.name} (${it.unit})` },
        // FONTOS: a Stripe a legkisebb pénznem-egységben várja az összeget.
        // HUF esetén ez "fillér" (1 Ft = 100 egység) - ezért *100.
        unit_amount: it.unitPrice * 100,
      },
      quantity: it.qty,
    }));

    // Rendelés mentése Firestore-ba. Utánvétnél azonnal visszaigazolt
    // állapotba kerül, bankkártyánál "pending"-ként várja a Stripe
    // visszaigazolását (webhook).
    const orderRef = await db.collection("orders").add({
      customer,
      invoice: invoice || null,
      items: lineItems,
      userId,
      paymentMethod: isCod ? "cod" : "card",
      deliveryDate,
      grossTotal,
      status: isCod ? "cod_confirmed" : "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Utánvét esetén nincs Stripe-hívás, azonnal visszajelzünk a kliensnek,
    // és e-mailben értesítjük a boltvezetőt.
    //
    // FONTOS: az automatikus számlázás (Számlázz.hu) SZÁNDÉKOSAN ki van
    // kapcsolva itt. A friss zöldség/gyümölcs rendelt mennyisége (pl. "1 kg")
    // gyakran eltér a ténylegesen lemért, kiszállított mennyiségtől, a
    // számlának viszont a valós mennyiséget kell tükröznie.
    if (isCod) {
      const codOrderData = { customer, invoice: invoice || null, items: lineItems, userId, paymentMethod: "cod", deliveryDate };
      try {
        await sendOrderNotificationEmail(codOrderData, orderRef.id);
      } catch (emailErr) {
        console.error("Rendelés-értesítő e-mail hiba (utánvét):", emailErr);
      }
      try {
        await sendCustomerOrderConfirmationEmail(codOrderData, orderRef.id);
      } catch (custEmailErr) {
        console.error("Vásárlói visszaigazoló e-mail hiba (utánvét):", custEmailErr);
      }
      res.status(200).json({ success: true, orderId: orderRef.id });
      return;
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const successUrl = process.env.SUCCESS_URL || "https://example.com/webshop.html?payment=success";
    const cancelUrl = process.env.CANCEL_URL || "https://example.com/webshop.html?payment=cancelled";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customer.email,
      line_items: stripeLineItems,
      success_url: `${successUrl}&order=${orderRef.id}`,
      cancel_url: cancelUrl,
      metadata: { orderId: orderRef.id, userId },
    });

    await orderRef.update({ stripeSessionId: session.id });

    res.status(200).json({ url: session.url, orderId: orderRef.id });
  } catch (err) {
    console.error("createCheckoutSession hiba:", err);
    res.status(500).json({ error: "Belső szerverhiba a rendelés indításakor." });
  }
};
