import { addrOf, type Row } from './logic.js';

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
  return AREAS.find(([,pattern]) => pattern.test(address))?.[0] ?? 'Other / address needs checking';
}
export function areaOptions(rows: Row[]) {
  return [...new Set(rows.map(areaOf))].sort().map(name => ({id:name,name}));
}
