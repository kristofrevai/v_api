/**
 * Vercel Serverless Function - Stripe Checkout Session létrehozása
 * ────────────────────────────────────────────────────────────────────────
 * Ugyanazt csinálja, mint a Firebase Cloud Function verzió, csak Vercelen
 * fut - ehhez nem kell Firebase Blaze csomag / bankkártya megadása a
 * Google felé.
 *
 * A rendelést a Firebase Admin SDK-n keresztül menti Firestore-ba (ez a
 * Firestore adatbázis maga ingyenes, Spark csomagon is elérhető).
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   STRIPE_SECRET_KEY        - a Stripe titkos kulcsod (sk_test_... vagy sk_live_...)
 *   FIREBASE_SERVICE_ACCOUNT - a Firebase service account JSON kulcs, EGY SORBAN
 *                              (lásd SETUP_GUIDE.md a beszerzéséhez)
 *   SUCCESS_URL               - pl. https://revaifruitkft.hu/webshop.html?payment=success
 *   CANCEL_URL                - pl. https://revaifruitkft.hu/webshop.html?payment=cancelled
 */

const Stripe = require("stripe");
const admin = require("firebase-admin");

// Firebase Admin csak egyszer inicializálódjon (Vercel újrahasznosíthatja a folyamatot hívások között)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  // CORS - engedjük, hogy a webshop.html (bármelyik domainről) hívhassa
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { customer, items, userId } = req.body || {};

    if (!customer || !customer.email || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Hiányzó vagy hibás adatok (customer/items)." });
      return;
    }

    // Szerveroldali validáció - soha ne bízzunk meg vakon a böngészőből jövő árban.
    const line_items = items.map((it) => {
      const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
      const unitPriceHUF = Math.max(0, Math.round(Number(it.unitPrice) || 0));
      return {
        price_data: {
          currency: "huf",
          product_data: { name: `${it.name} (${it.unit})` },
          unit_amount: unitPriceHUF*100,
        },
        quantity: qty,
      };
    });

    // Rendelés előzetes mentése Firestore-ba "pending" állapotban.
    const orderRef = await db.collection("orders").add({
      customer,
      items,
      userId: userId || null,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("createCheckoutSession hiba:", err);
    res.status(500).json({ error: "Belső szerverhiba a fizetés indításakor." });
  }
};
