// One-off patch: short, simple, accurate descriptions/taglines for all case-study
// products, using only data already verified elsewhere in specs.json (mixRatio,
// composition, application). Also fixes stale "pending/unpublished" copy left
// over from before composition data was confirmed for several products.
const fs = require('fs');
const path = require('path');

const SPECS_PATH = path.join(__dirname, '..', 'public', 'case-study', 'data', 'specs.json');
const specs = JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'));

const COPY = {
  bobbin: {
    tagline: 'A textile-industry bobbin, injection-moulded from a 40% LIMEX PE78-02M + 60% PP blend.',
    description: 'A bobbin for the textile industry, injection-moulded from a 40% LIMEX PE78-02M + 60% PP blend for the precise tolerances high-speed spinning demands.',
  },
  container: {
    tagline: 'A paint container with a glossy body and wire handle, moulded from a 25% LIMEX PE26 F-51 + 75% PP blend.',
    description: 'A paint container with a glossy tapered body, snap lid and wire handle, moulded from a 25% LIMEX PE26 F-51 + 75% PP blend.',
  },
  motorCover: {
    tagline: 'A ventilated motor fan cover, moulded from an equal 50% LIMEX PE26 F-51 + 50% PP blend.',
    description: 'A motor fan cover with a ventilated cylindrical body and mounting collar, moulded from an equal 50% LIMEX PE26 F-51 + 50% PP blend.',
  },
  aralditeContainer: {
    tagline: 'An adhesive dispenser container, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
    description: 'An adhesive dispenser container with a screw cap and flip-top base, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
  },
  handWashBottle: {
    tagline: 'A faceted hand wash dispenser bottle, moulded from a 40% LIMEX PE78-29L + 60% PP blend.',
    description: 'A hand wash dispenser bottle with a diamond-facet body and pump head, moulded from a 40% LIMEX PE78-29L + 60% PP blend.',
  },
  hardDish: {
    tagline: 'A 3-compartment serving dish, moulded from an equal 50% LIMEX PE26 F-51 + 50% PP blend.',
    description: 'A 3-compartment serving dish with a rolled rim, moulded from an equal 50% LIMEX PE26 F-51 + 50% PP blend, in four colourways.',
  },
  consilePipe: {
    tagline: 'A rigid conduit pipe for concealed wall wiring, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A rigid electrical conduit pipe for concealed civil/wall wiring, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  soapStand: {
    tagline: 'A three-part covered soap dish with a drain insert, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
    description: 'A three-part covered soap dish with an embossed lid, scalloped base and drain insert, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
  },
  foodOilCan: {
    tagline: 'A wide oil can with an offset fluted cap, moulded from a 30% LIMEX PE78-29L + 70% PP blend.',
    description: 'A wide oil can with an offset fluted cap and moulded handle, made from a 30% LIMEX PE78-29L + 70% PP blend.',
  },
  dairyProductsContainer: {
    tagline: 'A tapered dairy tub with a tamper-seal lid, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A tapered round dairy tub with a snap-fit, tamper-seal pull-tab lid, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  lunchBox: {
    tagline: 'A bento-style food container with a four-flap latch, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A rectangular bento-style food container sealed by a four-side buckle-flap latch, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  dairySweetContainer: {
    tagline: 'A compact sweet container with a snap-fit lid, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A compact food-grade sweet container with a snap-fit lid, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  dairyRoundContainer: {
    tagline: 'A round dairy bowl, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A round dairy packaging bowl, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  rectangleContainer: {
    tagline: 'A one-piece rectangular container, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A one-piece rectangular container with a continuous moulded rim, made from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  hook20mm: {
    tagline: 'A flexible 20 mm retaining clip, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
    description: 'A flexible W-profile 20 mm retaining clip with rounded prongs, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
  },
  roundPipe: {
    tagline: 'An industrial round pipe, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
    description: 'A single-piece industrial round pipe, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
  },
  applianceTray: {
    tagline: 'A fridge / washing-machine tray, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A fridge / washing-machine appliance tray, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  motorFanBlade: {
    tagline: 'A 12-blade motor impeller, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A one-piece 12-blade radial motor impeller, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  cupContainer: {
    tagline: 'A cup-style food container, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
    description: 'A cup-style food packaging container, moulded from a 30% LIMEX PE26 F-51 + 70% PP blend.',
  },
  toothBrush: {
    tagline: 'A toothbrush handle, moulded from a 10% LIMEX PE26 F-51 + 90% PP blend.',
    description: 'A personal-care toothbrush handle, moulded from a 10% LIMEX PE26 F-51 + 90% PP blend.',
  },
  petrolPipe: {
    tagline: 'An automotive petrol pipe component, moulded from a 30% LIMEX PE79-29L + 70% PP blend.',
    description: 'An automotive petrol pipe component, moulded from a 30% LIMEX PE79-29L + 70% PP blend.',
  },
  proteinContainer: {
    tagline: 'A nutrition container, moulded from an equal 50% LIMEX PE26 F-51 + 50% PP blend.',
    description: 'A protein / nutrition packaging container, moulded from an equal 50% LIMEX PE26 F-51 + 50% PP blend.',
  },
  rectangleBox: {
    tagline: 'A rectangular general-purpose container, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A rectangular general-purpose packaging container, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  smallRoundBottle: {
    tagline: 'A small round packaging bottle, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A small round general-purpose packaging bottle, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  saltBottle: {
    tagline: 'A salt-packaging bottle, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
    description: 'A food-packaging salt bottle, moulded from a 20% LIMEX PE26 F-51 + 80% PP blend.',
  },
  lightWeightContainer: {
    tagline: 'A lightweight general-purpose container, moulded from a 25% LIMEX PE78-29L + 75% PP blend.',
    description: 'A lightweight general-purpose packaging container, moulded from a 25% LIMEX PE78-29L + 75% PP blend.',
  },
  foodTrayDish: {
    tagline: 'A food tray dish, moulded from a 30% LIMEX + 70% PP blend.',
    description: 'A food-packaging tray dish, moulded from a 30% LIMEX + 70% PP blend.',
  },
  lightWeightDish: {
    tagline: 'A thin-wall circular dish, moulded from a 30% LIMEX PP24 Y-51 + 70% PP blend.',
    description: 'A thin-wall circular kitchenware dish, moulded from a 30% LIMEX PP24 Y-51 + 70% PP blend.',
  },
  dermicoolPowderBottle: {
    tagline: 'A personal-care powder bottle, moulded from a 70% LIMEX PP24 N-51 + 30% PP blend.',
    description: 'A personal-care powder bottle, moulded from a 70% LIMEX PP24 N-51 + 30% PP blend.',
  },
  wovenThread: {
    tagline: 'A textile-grade woven thread material, made from a 70% LIMEX PE26 F-51 + 30% PP blend.',
    description: 'A textile-grade woven thread material, made from a 70% LIMEX PE26 F-51 + 30% PP blend.',
  },
  childBottle: {
    tagline: 'A child-safe personal-care bottle, moulded from a 70% LIMEX + 30% PP blend.',
    description: 'A child-safe personal-care bottle, moulded from a 70% LIMEX + 30% PP blend.',
  },
  waterTub: {
    tagline: 'A bathroom bath tumbler, moulded from a 70% LIMEX + 30% PP blend.',
    description: 'A bathroom accessory bath tumbler, moulded from a 70% LIMEX + 30% PP blend.',
  },
  toiletSeat: {
    tagline: 'A sanitaryware toilet seat, moulded from a 70% LIMEX + 30% PP blend.',
    description: 'A sanitaryware toilet seat, moulded from a 70% LIMEX + 30% PP blend.',
  },
  nonWovenBag: {
    tagline: 'A non-woven packaging bag material, made from a 70% LIMEX PE26 F-51 + 30% PP blend.',
    description: 'A non-woven packaging bag material, made from a 70% LIMEX PE26 F-51 + 30% PP blend.',
  },
  courierBag: {
    tagline: 'A logistics courier bag material, made from a 70% LIMEX PE78-29L + 30% PP blend.',
    description: 'A logistics courier bag material, made from a 70% LIMEX PE78-29L + 30% PP blend.',
  },
};

let changed = 0;
for (const [id, copy] of Object.entries(COPY)) {
  const entry = specs.products[id];
  if (!entry) {
    console.warn('[skip] no specs entry for', id);
    continue;
  }
  entry.tagline = copy.tagline;
  entry.description = copy.description;
  changed += 1;

  // Fix stale "Pending" / "Not published" highlight+spec rows left over from
  // before this product's composition data was confirmed.
  if (Array.isArray(entry.highlights)) {
    entry.highlights = entry.highlights.filter(h => h.num !== 'Pending');
  }
  if (Array.isArray(entry.specs)) {
    entry.specs = entry.specs.filter(s => !(s.label === 'Composition' && s.verified === false));
  }
}

fs.writeFileSync(SPECS_PATH, JSON.stringify(specs, null, 2) + '\n', 'utf8');
console.log(`Patched ${changed} products in specs.json`);
