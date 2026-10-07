// Verifica el motor de ofertas contra los casos de paridad compartidos con qatalo-api.
// Uso: node src/helpers/offerEngine.check.mjs   (sale con código 1 si algún caso falla)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pickWinningOffer, distributeDiscount, calcDiscount } from "./offerEngine.js";

const here = dirname(fileURLToPath(import.meta.url));
const { cases } = JSON.parse(readFileSync(join(here, "__fixtures__", "offerCases.json"), "utf8"));

const close = (a, b, tol = 0.005) => Math.abs((Number(a) || 0) - (Number(b) || 0)) <= tol;
let failed = 0;

for (const c of cases) {
  const errors = [];
  const subtotal = c.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const { winner, discount } = pickWinningOffer(c.offers, c.items, subtotal);
  const winnerId = winner ? winner.offer_id : null;
  const exp = c.expected;

  if (winnerId !== exp.winner_offer_id) errors.push(`ganadora ${winnerId} != ${exp.winner_offer_id}`);
  if (!close(discount, exp.total_discount)) errors.push(`descuento ${discount} != ${exp.total_discount}`);
  if (winner && !close(calcDiscount(winner, c.items), discount)) errors.push("calcDiscount != pickWinningOffer");

  const lines = distributeDiscount(winner, c.items, discount);
  const sumLines = lines.reduce((s, l) => s + (Number(l.discount_amount) || 0), 0);
  if (!close(sumLines, exp.total_discount)) errors.push(`suma por línea ${sumLines} != ${exp.total_discount}`);
  exp.lines.forEach((el, i) => {
    const l = lines[i];
    if (!l) return errors.push(`falta línea ${el.line_id}`);
    if (l.line_id !== el.line_id) errors.push(`orden de línea ${l.line_id} != ${el.line_id}`);
    if (!close(l.discount_amount, el.discount_amount))
      errors.push(`${el.line_id}.discount_amount ${l.discount_amount} != ${el.discount_amount}`);
    if (!close(l.price, el.price, 0.01)) errors.push(`${el.line_id}.price ${l.price} != ${el.price}`);
    if (Number(l.price) < 0) errors.push(`${el.line_id} precio negativo`);
    if (Number(l.original_price) !== Number(c.items[i].price)) errors.push(`${el.line_id}.original_price alterado`);
  });

  if (errors.length) {
    failed++;
    console.log(`FAIL ${c.name}\n  - ${errors.join("\n  - ")}`);
  } else {
    console.log(`ok   ${c.name}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} casos OK`);
process.exit(failed ? 1 : 0);
