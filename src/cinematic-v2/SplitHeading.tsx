import React from 'react';

/**
 * chars — splits a string into individually animated .v2-char spans.
 * globalStart keeps the stagger counter continuous across multiple lines
 * within the same heading so the animation flows without gaps.
 * Pass extraClass for accent chars (e.g. 'v2-char--accent').
 */
export function chars(
  text: string,
  globalStart = 0,
  extraClass = '',
): React.ReactNode[] {
  return [...text].map((ch, i) => (
    <span
      key={i}
      className={extraClass ? `v2-char ${extraClass}` : 'v2-char'}
      style={{ '--ci': String(globalStart + i) } as React.CSSProperties}
    >
      {ch}
    </span>
  ));
}
