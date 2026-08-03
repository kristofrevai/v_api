/**
 * Szállítási napok és rendelési határidő - EGYETLEN igazságforrás a
 * szerveroldalon (a webshop.html-ben lévő naptár ugyanezt a logikát
 * valósítja meg kliensoldalon, a felhasználói élményhez).
 *
 * Szabály: szállítási nap hétfő, szerda, péntek. A rendelést a szállítást
 * MEGELŐZŐ naptári napon 15:00 óráig (magyarországi/budapesti idő szerint)
 * kell leadni:
 *   - szerdai szállításhoz kedd 15:00-ig
 *   - péntekihez csütörtök 15:00-ig
 *   - (következő) hétfőihez vasárnap 15:00-ig
 *
 * FONTOS IDŐZÓNA-MEGJEGYZÉS: a Vercel szerver-függvények jellemzően UTC
 * időzónában futnak, a vásárlók viszont magyar (Europe/Budapest) idő
 * szerint gondolkodnak a "15 óráról". Ha egyszerűen a szerver saját,
 * lokális óráját néznénk, a határidő tévesen csúszna (UTC-ben "15:00" nyáron
 * valójában 17:00, télen 16:00 budapesti idő szerint lenne). Ezért a "most"
 * időpontot MINDIG explicit módon Europe/Budapest időzónára konvertáljuk
 * (Intl.DateTimeFormat segítségével), mielőtt összehasonlítanánk a
 * határidővel - így a szerver fizikai időzónájától teljesen függetlenül,
 * mindig helyesen viselkedik.
 */

const ALLOWED_DELIVERY_WEEKDAYS = [1, 3, 5]; // hétfő, szerda, péntek (JS Date.getDay() szerint)
const CUTOFF_HOUR = 15; // óra, budapesti idő szerint

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Egy adott pillanatból (Date objektum, bármilyen szerver-időzónában
// futtatva) kiolvassa a budapesti falióra szerinti év/hónap/nap/óra/perc
// értékeket.
function getBudapestParts(date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Budapest",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    hour12: false,
  });
  const map = {};
  fmt.formatToParts(date).forEach(function (p) {
    if (p.type !== "literal") map[p.type] = p.value;
  });
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    // Néhány locale/Node verzió éjfélkor "24"-et ad óraként hour12:false
    // mellett - ezt 0-ra normalizáljuk, hogy biztosan 0-23 tartományban maradjon.
    hour: parseInt(map.hour, 10) % 24,
    minute: parseInt(map.minute, 10),
  };
}

/**
 * Megmondja, hogy a megadott 'YYYY-MM-DD' szállítási napra a `now`
 * időpontban (alapértelmezetten a jelenlegi pillanat) MÉG le lehet-e adni
 * rendelést - azaz nem múlt-e el a hozzá tartozó, előző naptári napi 15:00
 * órás (budapesti idő szerinti) határidő.
 */
function isDeliveryDateOrderable(deliveryDateStr, now) {
  now = now || new Date();
  const parts = String(deliveryDateStr).split("-").map(Number);
  if (parts.length !== 3 || parts.some(function (n) { return isNaN(n); })) return false;
  const y = parts[0], m = parts[1], d = parts[2];

  // A határidő napja: a szállítási napot megelőző naptári nap. Tisztán
  // naptári (év-hónap-nap) aritmetika, UTC-vel számolva - ez itt csak
  // dátum-számtan, NEM egy valós időponthoz kötött időzóna-konverzió, ezért
  // biztonságosan használható a szerver saját időzónájától függetlenül.
  const cutoffDayUtc = new Date(Date.UTC(y, m - 1, d));
  cutoffDayUtc.setUTCDate(cutoffDayUtc.getUTCDate() - 1);
  const cutoffKey =
    cutoffDayUtc.getUTCFullYear() + "-" + pad2(cutoffDayUtc.getUTCMonth() + 1) + "-" + pad2(cutoffDayUtc.getUTCDate()) +
    " " + pad2(CUTOFF_HOUR) + ":00";

  const nowBp = getBudapestParts(now);
  const nowKey =
    nowBp.year + "-" + pad2(nowBp.month) + "-" + pad2(nowBp.day) +
    " " + pad2(nowBp.hour) + ":" + pad2(nowBp.minute);

  return nowKey <= cutoffKey;
}

/**
 * Teljes ellenőrzés: a dátum formátuma érvényes-e, ténylegesen szállítási
 * napra esik-e (hétfő/szerda/péntek), és a hozzá tartozó rendelési
 * határidő még nem járt-e le.
 */
function isValidDeliveryDate(dateStr, now) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(function (n) { return isNaN(n); })) return false;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(d.getTime())) return false;
  if (ALLOWED_DELIVERY_WEEKDAYS.indexOf(d.getDay()) === -1) return false;
  return isDeliveryDateOrderable(dateStr, now);
}

module.exports = {
  ALLOWED_DELIVERY_WEEKDAYS,
  CUTOFF_HOUR,
  isDeliveryDateOrderable,
  isValidDeliveryDate,
};
