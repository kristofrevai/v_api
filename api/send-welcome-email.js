/**
 * Vercel Serverless Function - Üdvözlő e-mail küldése regisztrációkor
 * ────────────────────────────────────────────────────────────────────────
 * A webshop.html a sikeres Firebase regisztráció után hívja meg ezt a
 * végpontot, hogy a felhasználó egy üdvözlő e-mailt kapjon.
 *
 * Szükséges környezeti változók (Vercel Project Settings → Environment Variables):
 *   RESEND_API_KEY     - a Resend fiókodból (resend.com)
 *   NOTIFY_FROM_EMAIL   - opcionális, a feladó cím (alapértelmezett: Resend teszt domain)
 */

const { sendWelcomeEmail } = require("../lib/email");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  try {
    const { name, email, accountType } = req.body || {};

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Hiányzó e-mail cím." });
      return;
    }

    await sendWelcomeEmail(name || "", email, accountType || "private");

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("send-welcome-email hiba:", err);
    // Ez egy másodlagos, nem kritikus funkció - a kliens úgyis fire-and-forget
    // módon hívja, de azért adjunk vissza egy értelmes hibát, ha valaki
    // közvetlenül tesztelné az endpointot.
    res.status(500).json({ error: "Belső szerverhiba az üdvözlő e-mail küldésekor." });
  }
};
