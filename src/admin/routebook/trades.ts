/* What a plant actually makes, as a controlled vocabulary.
 *
 * The register's tags are written by hand during research, so the same trade
 * arrives spelled a dozen ways — "Opaque PP", "Opaque HDPE/LLDPE", "Opaque
 * mouldings" are one thing to a LIMEX seller, and the book listed them as
 * three. Worse, the same field carries things that are not trades at all: a
 * geography ("Changodar", "Canada"), a vintage ("Est. 1987"), a scale
 * ("₹300+ cr scale"), a reminder to the researcher ("Confirm plant"). Those
 * fed the "What they make" chips, so the rail offered "Canada 25" as a thing
 * a factory manufactures.
 *
 * So: one canonical trade per tag, or null when the tag is not a trade. The
 * tag itself stays on the record — it is research, and worth reading on the
 * card — it just stops pretending to be a filter. */

/** The trades a LIMEX conversation can actually start from. */
export const TRADES = [
  "Thin wall", "Containers & jars", "Bottles & drums", "Film & sacks",
  "Woven & FIBC", "Pipes & fittings", "Caps & closures", "Toys",
  "Masterbatch", "Moulded parts", "Houseware & crates", "Packaging",
  "Disposables", "IML", "Opaque", "General plastics",
] as const;
export type Trade = (typeof TRADES)[number];

/** Where the register only said "plastics". Six hundred records say no more
 *  than that — mostly GIDC listings, which name the industry and stop. The
 *  chip is kept so those records stay reachable, and sorted last so the
 *  trades that actually narrow the book lead the rail. It doubles as the
 *  research queue: everything here still needs a product pinned down. */
export const GENERIC_TRADE: Trade = "General plastics";

/** Tags that describe the record, not the trade — never a filter chip.
 *  Matched before the trade rules, because "Container Moulds" is a toolroom
 *  and "Opaque BOPP film" is a converter, and only order tells them apart. */
const NOT_A_TRADE: RegExp[] = [
  // Tooling and machinery. A mould maker buys steel, not resin.
  /\b(toolroom|toolmaker|moulds? *(&|and)? *dies|container moulds|machinery|machines|plant builder)\b/i,
  // Geography. The area rail already answers "where".
  /\b(canada|changodar|moraiya|kubadthal|sanand|nh-?8|estate plot|same (plot|estate|block)|multi-?plot|plant of )/i,
  // Vintage, scale and corporate shape.
  /(\best\.|\byears?\b|\d+\s*(yrs|cr\b)|₹|\bmt\/month\b|\bplants?\b|\bunits?\b|\biso\b|sq ft|listed|large|legacy|established|mid-large|pvt ltd|group\b|corporate|multi-plant)/i,
  // Notes the researcher left for the next pass.
  /\b(contacted|call,|phone first|confirm|verify|name clash|recovered|best fit|job work|office only|hq only|materials trade|specialist|green line|bio line|label tier|channel lead|exporter|custom moulder|precision moulder|peripherals|recycling|compounding)\b/i,
];

/** Ordered: the first match wins, so specific beats generic. */
const TRADE_RULES: [RegExp, Trade][] = [
  [/\b(iml)\b/i, "IML"],
  [/thin[- ]wall|\btw\b|sweet box/i, "Thin wall"],
  [/\b(toys?)\b/i, "Toys"],
  [/masterbatch|compounds?\b/i, "Masterbatch"],
  [/woven|fibc|tarpaulin|geomembrane|geosynthetic|bulk bags/i, "Woven & FIBC"],
  [/\bpipes?\b|fittings|drainage|hose|valves/i, "Pipes & fittings"],
  [/caps?\b|closures?|tubes/i, "Caps & closures"],
  [/disposable|takeaway|cup filling/i, "Disposables"],
  [/bottle|preform|drum|blow[- ]?mould/i, "Bottles & drums"],
  [/film|sacks|blown|lamination|laminated|pouch|extruded net/i, "Film & sacks"],
  [/container|jars?\b|bowls?|tubs?|curd|ice cream/i, "Containers & jars"],
  [/houseware|crates|bins|storage/i, "Houseware & crates"],
  [/moulded|mouldings|components|auto |rotomoulding|extrusion|injection|acrylic|frp|composites/i, "Moulded parts"],
  [/packaging|cartons|label|wrapper|printed packs/i, "Packaging"],
  // "Opaque" alone is the LIMEX tell, but only when nothing better fits.
  [/opaque/i, "Opaque"],
  // Last of all: the register named the industry and nothing more.
  [/^(plastics?|polymers?|polyplast|polymer processing)$/i, GENERIC_TRADE],
];

/** The canonical trade a research tag names, or null when it names none. */
export function tradeOf(tag: string): Trade | null {
  for (const re of NOT_A_TRADE) if (re.test(tag)) return null;
  for (const [re, trade] of TRADE_RULES) if (re.test(tag)) return trade;
  return null;
}
