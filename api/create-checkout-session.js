/**
 * Vercel Serverless Function - Rendelés indítása (Stripe bankkártya, vagy utánvét)
 * ────────────────────────────────────────────────────────────────────────
 * Bankkártyás fizetésnél: Stripe Checkout Session-t hoz létre, és a session
 * URL-jét adja vissza, amire a kliens átirányítja a vásárlót.
 * Utánvétes fizetésnél: nincs Stripe-hívás, a rendelés azonnal
 * "cod_confirmed" állapottal kerül mentésre, és e-mail értesítés megy a
 * boltvezetőnek.
 *
 * MEGJEGYZÉS: az automatikus Számlázz.hu-integráció (lib/szamlazz.js) készen
 * áll, de jelenleg SZÁNDÉKOSAN nincs bekötve - friss áru (zöldség/gyümölcs)
 * rendelt és ténylegesen kiszállított/lemért mennyisége eltérhet, ezért a
 * számlázásnak meg kell várnia a tényleges mennyiségek megerősítését (pl.
 * egy admin felületről), nem indulhat el automatikusan a rendeléskor.
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   STRIPE_SECRET_KEY        - a Stripe titkos kulcsod (sk_test_... vagy sk_live_...)
 *   FIREBASE_SERVICE_ACCOUNT - a Firebase service account JSON kulcs, EGY SORBAN
 *   SUCCESS_URL               - pl. https://revaifruitkft.hu/webshop.html?payment=success
 *   CANCEL_URL                - pl. https://revaifruitkft.hu/webshop.html?payment=cancelled
 *   RESEND_API_KEY            - rendelés-értesítő e-mailhez (lásd lib/email.js)
 *   NOTIFY_EMAIL              - ide érkeznek az értesítések
 */

const Stripe = require("stripe");
const admin = require("firebase-admin");
const { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } = require("../lib/email");

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

module.exports = async (req, res) => {
  // CORS - engedjük, hogy a webshop.html (bármelyik domainről) hívhassa
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const { customer, invoice, items, userId, paymentMethod, deliveryDate } = req.body || {};

    if (!customer || !customer.email || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Hiányzó vagy hibás adatok (customer/items)." });
      return;
    }

    // A rendeléshez bejelentkezett fiók szükséges - ezt a kliens felület már
    // eleve kikényszeríti, ez itt a szerveroldali dupla védelem közvetlen
    // API-hívás esetére.
    if (!userId || typeof userId !== "string") {
      res.status(401).json({ error: "A rendelés leadásához bejelentkezés szükséges." });
      return;
    }

    if (!isValidDeliveryDate(deliveryDate)) {
      res.status(400).json({ error: "Érvénytelen szállítási nap. Csak hétfő, szerda vagy péntek választható, jövőbeli dátummal." });
      return;
    }

    const isCod = paymentMethod === "cod";

    // Szerveroldali validáció - soha ne bízzunk meg vakon a böngészőből jövő árban.
    const line_items = items.map((it) => {
      const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
      const unitPriceHUF = Math.max(0, Math.round(Number(it.unitPrice) || 0));
      // FONTOS: a Stripe a legkisebb pénznem-egységben várja az összeget.
      // HUF esetén ez nem maga a forint, hanem "fillér" (1 Ft = 100 egység
      // a Stripe API szemszögéből) - ezért kell *100-zal szorozni.
      return {
        price_data: {
          currency: "huf",
          product_data: { name: `${it.name} (${it.unit})` },
          unit_amount: unitPriceHUF * 100,
        },
        quantity: qty,
      };
    });

    // Rendelés mentése Firestore-ba. Utánvétnél azonnal visszaigazolt
    // állapotba kerül, bankkártyánál "pending"-ként várja a Stripe
    // visszaigazolását (webhook).
    const orderRef = await db.collection("orders").add({
      customer,
      invoice: invoice || null,
      items,
      userId: userId || null,
      paymentMethod: isCod ? "cod" : "card",
      deliveryDate,
      status: isCod ? "cod_confirmed" : "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Utánvét esetén nincs Stripe-hívás, azonnal visszajelzünk a kliensnek,
    // és e-mailben értesítjük a boltvezetőt.
    //
    // FONTOS: az automatikus számlázás (Számlázz.hu) SZÁNDÉKOSAN ki van
    // kapcsolva itt. A friss zöldség/gyümölcs rendelt mennyisége (pl. "1 kg")
    // gyakran eltér a ténylegesen lemért, kiszállított mennyiségtől, a
    // számlának viszont a valós mennyiséget kell tükröznie. A lib/szamlazz.js
    // kód megmarad, és később, egy admin felületről (a tényleges lemért
    // mennyiségek megerősítése után) újra bekapcsolható lesz.
    if (isCod) {
      const codOrderData = { customer, invoice: invoice || null, items, userId: userId || null, paymentMethod: "cod", deliveryDate };
      try {
        await sendOrderNotificationEmail(codOrderData, orderRef.id);
      } catch (emailErr) {
        console.error("Rendelés-értesítő e-mail hiba (utánvét):", emailErr);
        // Az e-mail hibája nem akadályozhatja meg a sikeres rendelés visszaigazolását.
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
      line_items,
      success_url: `${successUrl}&order=${orderRef.id}`,
      cancel_url: cancelUrl,
      metadata: { orderId: orderRef.id, userId: userId || "" },
    });

    await orderRef.update({ stripeSessionId: session.id });

    res.status(200).json({ url: session.url, orderId: orderRef.id });
  } catch (err) {
    console.error("createCheckoutSession hiba:", err);
    res.status(500).json({ error: "Belső szerverhiba a rendelés indításakor." });
  }
};
