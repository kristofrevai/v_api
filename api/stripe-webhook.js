/**
 * Vercel Serverless Function - Stripe webhook fogadása
 * ────────────────────────────────────────────────────────────────────────
 * A Stripe ide küldi a "checkout.session.completed" eseményt sikeres
 * fizetéskor, mi pedig a Firestore-ban lévő rendelést "paid"-re állítjuk.
 *
 * FONTOS: a Stripe aláírás-ellenőrzéshez a NYERS (raw) request body kell,
 * ezért kikapcsoljuk a Vercel alapértelmezett body parsolását.
 */

const Stripe = require("stripe");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Kikapcsoljuk a body-parsert, hogy a nyers byte-okat kapjuk (a Stripe aláírás-ellenőrzéshez ez kötelező).
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).end("Method not allowed"); return; }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook aláírás-ellenőrzési hiba:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata && session.metadata.orderId;
    if (orderId) {
      try {
        await db.collection("orders").doc(orderId).update({
          status: "paid",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          stripePaymentIntent: session.payment_intent || null,
        });
      } catch (err) {
        console.error("Rendelés frissítési hiba:", err);
      }
    }
  }

  res.status(200).json({ received: true });
};
