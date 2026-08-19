const Stripe = require("stripe");
const admin = require("firebase-admin");
const { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } = require("../lib/email");
const { getVatRate, findItem } = require("../lib/catalog");
const { applyCors } = require("../lib/security");
const { isValidDeliveryDate } = require("../lib/delivery");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

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
  applyCors(req, res);

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
      // FONTOS: checkRevoked=true - így egy kijelentkeztetett/visszavont
      // munkamenettel nem lehet tovább élő ID tokent felhasználni ez ellen
      // a végpont ellen.
      decodedToken = await admin.auth().verifyIdToken(idToken, true);
    } catch (tokenErr) {
      console.error("ID token ellenőrzési hiba:", tokenErr);
      res.status(401).json({ error: "A bejelentkezés lejárt vagy érvénytelen. Kérjük, jelentkezzen be újra." });
      return;
    }
    const userId = decodedToken.uid;

    // ─── 1.4) Fiók lekérdezése a SAJÁT (szerveroldali) adatbázisból: jóváhagyási
    // állapot ÉS fiók típusa egy helyen ───
    // FONTOS: ez a VALÓDI, megkerülhetetlen kapu a rendelés leadásához. A
    // Firestore-ban tárolt `status` mezőt a kliens (lásd a Firestore
    // Security Rules-t) SOSEM tudja saját magának 'approved'-ra írni - azt
    // kizárólag az api/approve-user.js végpont állíthatja be, Admin SDK-val.
    // Ez azt jelenti, hogy akkor is biztosan jóváhagyott fiók kell a
    // rendeléshez, ha valaki közvetlenül hívná ezt a végpontot, a
    // kliensoldali UI-t megkerülve.
    //
    // KORÁBBAN itt az e-mail cím megerősítését (decodedToken.email_verified)
    // ellenőriztük - ezt a jóváhagyás-alapú fiókrendszer bevezetésével ez a
    // `status === 'approved'` ellenőrzés váltja fel, mert a regisztráció
    // után a kliensen már nincs kötelező e-mail-megerősítési lépés.
    let accountType = null;
    let accountStatus = null;
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        accountType = userData.accountType || null;
        accountStatus = userData.status || null;
      }
    } catch (userDocErr) {
      console.error("Felhasználói fiók adatainak lekérdezési hiba:", userDocErr);
    }

    if (accountStatus !== "approved") {
      res.status(403).json({
        error: "A fiókja még jóváhagyásra vár. Miután munkatársunk jóváhagyta (erről e-mailben értesítjük), tud majd rendelést leadni."
      });
      return;
    }

    const { customer, invoice, items, paymentMethod, deliveryDate } = req.body || {};

    if (!customer || !customer.email || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Hiányzó vagy hibás adatok (customer/items)." });
      return;
    }

    if (!isValidDeliveryDate(deliveryDate)) {
      res.status(400).json({ error: "Érvénytelen szállítási nap, vagy a hozzá tartozó rendelési határidő (a szállítást megelőző nap 14:00) már lejárt. Kérjük, válasszon másik szállítási napot." });
      return;
    }

    // A fizetési mód (kártya/utánvét/utalásos számla) NEM a kliens állítása
    // alapján dől el, hanem a Firestore-ban tárolt, tényleges fiók típusa
    // szerint (lásd fent) - így egy magánszemély fiók nem tud "utalásos
    // számlát" választani a kliensoldali UI megkerülésével, és fordítva.
    let effectivePaymentMethod;
    if (accountType === "company") {
      // Céges fiókoknál kizárólag utalásos számla választható, függetlenül
      // attól, hogy a kliens mit küldött.
      effectivePaymentMethod = "bank_transfer";
    } else {
      if (paymentMethod === "bank_transfer") {
        res.status(400).json({ error: "Az utalásos számla fizetési mód kizárólag céges fiókok számára elérhető." });
        return;
      }
      effectivePaymentMethod = paymentMethod === "cod" ? "cod" : "card";
    }

    // ─── 2) Tételek és árak kizárólag a szerveroldali katalógusból ───
    const trusted = buildTrustedLineItems(items);
    if (trusted.error) {
      res.status(400).json({ error: trusted.error });
      return;
    }
    const { lineItems, grossTotal } = trusted;

    const isCod = effectivePaymentMethod === "cod";
    const isBankTransfer = effectivePaymentMethod === "bank_transfer";

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

    // Rendelés mentése Firestore-ba.
    // - Utánvétnél azonnal visszaigazolt állapotba kerül.
    // - Utalásos számlánál (céges fiók) "bank_transfer_pending" állapotba
    //   kerül - a számlázás csak a tényleges, kiszállított mennyiség admin
    //   általi megerősítése után indul (lásd lentebb).
    // - Bankkártyánál "pending"-ként várja a Stripe visszaigazolását (webhook).
    const orderRef = await db.collection("orders").add({
      customer,
      invoice: invoice || null,
      items: lineItems,
      userId,
      paymentMethod: effectivePaymentMethod,
      deliveryDate,
      grossTotal,
      status: isCod ? "cod_confirmed" : (isBankTransfer ? "bank_transfer_pending" : "pending"),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Utánvét és utalásos számla esetén nincs Stripe-hívás, azonnal
    // visszajelzünk a kliensnek, és e-mailben értesítjük a boltvezetőt.
    //
    // FONTOS: az automatikus számlázás (Számlázz.hu) SZÁNDÉKOSAN ki van
    // kapcsolva mindhárom fizetési módnál (kártya, utánvét, utalásos számla).
    // A friss zöldség/gyümölcs rendelt mennyisége (pl. "1 kg") gyakran eltér
    // a ténylegesen lemért, kiszállított mennyiségtől, a számlának viszont a
    // valós mennyiséget kell tükröznie - ezért a számlázás minden esetben
    // egy admin felületről történő, valós mennyiség-megerősítésre vár.
    if (isCod || isBankTransfer) {
      const offlineOrderData = { customer, invoice: invoice || null, items: lineItems, userId, paymentMethod: effectivePaymentMethod, deliveryDate };
      try {
        await sendOrderNotificationEmail(offlineOrderData, orderRef.id);
      } catch (emailErr) {
        console.error("Rendelés-értesítő e-mail hiba (utánvét/utalás):", emailErr);
      }
      try {
        await sendCustomerOrderConfirmationEmail(offlineOrderData, orderRef.id);
      } catch (custEmailErr) {
        console.error("Vásárlói visszaigazoló e-mail hiba (utánvét/utalás):", custEmailErr);
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
