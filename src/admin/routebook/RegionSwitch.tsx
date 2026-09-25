/* India | Canada — which register the books show. */

import { REGIONS, useRegion } from "./region.js";

export function RegionSwitch({ compact }: { compact?: boolean }) {
  const [region, setRegion] = useRegion();
  return (
    <div className={`wd-region${compact ? " is-compact" : ""}`} role="group" aria-label="Region">
      {REGIONS.map(([id, label]) => (
        <button key={id} type="button" aria-pressed={region === id} onClick={() => setRegion(id)} data-testid={`region-${id}`}>
          {compact ? id : label}
        </button>
      ))}
    </div>
  );
}
