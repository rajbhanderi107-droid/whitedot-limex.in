import type React from 'react';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'model-viewer': React.HTMLAttributes<HTMLElement> & { [key: string]: any };
      }
    }
  }
}
