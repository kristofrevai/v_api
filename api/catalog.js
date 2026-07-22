/**
 * Vercel Serverless Function - a teljes termékkatalógus kiadása JSON-ban.
 * Ezt hívja meg a webshop.html induláskor, hogy MINDIG ugyanazokat az
 * árakat/kiszereléseket mutassa, amiket a szerver ténylegesen felszámol.
 * Publikus, csak-olvasható végpont - nem igényel bejelentkezést.
 */

const { CATALOG } = require("../lib/catalog");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ catalog: CATALOG });
};
