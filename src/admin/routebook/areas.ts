import { addrOf, type Row } from './logic.js';
import { isCanadian } from './region.js';

// Canada: applied only to Canadian companies (see region.ts), so these
// names can never catch a Gujarat address.
const CA_AREAS: [string, RegExp][] = [
  ['Canada — Toronto area (GTA)', /toronto|mississauga|brampton|etobicoke|scarborough|north york|vaughan|concord|woodbridge|markham|richmond hill|oakville|pickering|ajax|bolton|caledon|milton|\bON\b\s+[ML]\d/i],
  ['Canada — Ontario, other', /\bON\b|ontario|hamilton|kitchener|guelph|ottawa|barrie/i],
  ['Canada — Quebec', /\bQC\b|qu[eé]bec|montr[eé]al|laval|longueuil|boucherville|drummondville|granby|sherbrooke/i],
  ['Canada — British Columbia', /\bBC\b|british columbia|vancouver|burnaby|langley|abbotsford/i],
  ['Canada — Alberta', /\bAB\b|alberta|calgary|edmonton/i],
  ['Canada — Prairies', /\b(?:MB|SK)\b|manitoba|saskatchewan|winnipeg|regina|saskatoon/i],
  ['Canada — Atlantic', /\b(?:NS|NB|NL|PE)\b|nova scotia|new brunswick|newfoundland|halifax|moncton/i],
];

// Address-based areas, independent of research batches or product categories.
const AREAS: [string, RegExp][] = [
  ['Kubadthal / Kuha', /kubadthal|kuha\b|bhavda|bakrol.buj/i],
  ['Kathwada / Singarva', /kathwada|singarva/i],
  ['Naroda', /naroda/i], ['Odhav', /odhav/i], ['Vatva', /vatva/i],
  ['Narol', /narol/i], ['Rakhial / Amraiwadi', /rakhial|amraiwadi/i],
  ['Changodar / Moraiya', /changodar|moraiya/i], ['Sanand / Bol', /sanand|\bbol\b/i],
  ['Bavla / Dholka', /bavla|dholka/i], ['Bakrol / Daskroi', /bakrol|daskroi/i],
  ['Santej / Khatraj / Kalol', /santej|khatraj|kalol|chhatral|moti bhoyan|vadsar/i],
  ['Gandhinagar / Dehgam', /gandhinagar|dehgam|dahegam|chandrala/i],
  ['Ahmedabad — other', /ahmedabad|shela|bopal|sarkhej/i],
  ['Vadodara / Halol', /vadodara|baroda|halol|savli|manjusar/i],
  ['Anand / Kheda', /anand|kheda|nadiad|khambhat|udyog.?nagar/i],
  ['Rajkot / Morbi', /rajkot|morbi|metoda|shapar/i],
  ['Surat / South Gujarat', /surat|vapi|valsad|ankleshwar|bharuch|umbergaon/i],
  ['Bhavnagar', /bhavnagar/i],
];
export function areaOf(row: Row): string {
  const address = addrOf(row.s, row.m) ?? '';
  if (isCanadian(row.s, row.m)) return CA_AREAS.find(([,pattern]) => pattern.test(address))?.[0] ?? 'Canada — address to confirm';
  return AREAS.find(([,pattern]) => pattern.test(address))?.[0] ?? 'Other / address needs checking';
}
export function areaOptions(rows: Row[]) {
  return [...new Set(rows.map(areaOf))].sort().map(name => ({id:name,name}));
}
