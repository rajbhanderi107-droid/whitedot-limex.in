// ─────────────────────────────────────────────────────────────────────────────
// Global brand wordmark pass.
//
// Most LIMEX/TBM mentions are wrapped as <span className="wd-limex"> directly in
// JSX. But a lot of display copy lives as plain strings in *.ts data files
// (heroCinematics.ts, god-wd-data.ts, route copy, etc.) and is rendered as
// {text} — a JSX span cannot be embedded in a plain string. This module styles
// those remaining occurrences at runtime by walking rendered text nodes and
// wrapping the bare words "LIMEX" / "TBM" in the brand classes.
//
// It is SAFE and idempotent:
//  • only touches Text nodes inside <body>
//  • skips inputs, textareas, contenteditable, <code>/<pre>/<script>/<style>
//  • skips any node already inside a .wd-limex / .wd-tbm (no double-wrap)
//  • skips SVG, the assistant input, and elements opting out via data-no-wordmark
//  • runs after mount and re-runs (debounced) on DOM changes via MutationObserver
// ─────────────────────────────────────────────────────────────────────────────

const WORD_RE = /\b(LIMEX|TBM)\b/g;

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA", "INPUT", "SELECT", "OPTION",
  "NOSCRIPT", "SVG", "CANVAS", "TITLE",
]);

function shouldSkip(node: Node): boolean {
  let el = node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.classList.contains("wd-limex") || el.classList.contains("wd-tbm")) return true;
    if (el.hasAttribute("data-no-wordmark")) return true;
    el = el.parentElement;
  }
  return false;
}

function wrapTextNode(textNode: Text): void {
  const text = textNode.nodeValue;
  if (!text || !WORD_RE.test(text)) return;
  WORD_RE.lastIndex = 0;
  if (shouldSkip(textNode)) return;

  const frag = document.createDocumentFragment();
  let last = 0;
  let m: RegExpExecArray | null;
  WORD_RE.lastIndex = 0;
  while ((m = WORD_RE.exec(text)) !== null) {
    const start = m.index;
    if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
    const span = document.createElement("span");
    span.className = m[1] === "LIMEX" ? "wd-limex" : "wd-tbm";
    span.textContent = m[1];
    frag.appendChild(span);
    last = start + m[1].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  textNode.parentNode?.replaceChild(frag, textNode);
}

function scan(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const t = node.nodeValue;
      if (!t) return NodeFilter.FILTER_REJECT;
      WORD_RE.lastIndex = 0;
      return WORD_RE.test(t) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const targets: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) targets.push(n as Text);
  targets.forEach(wrapTextNode);
}

let scheduled = false;
function schedule(root: ParentNode = document.body): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    try {
      scan(root);
    } catch {
      /* never let a styling pass break the app */
    }
  });
}

let started = false;

/** Start the global wordmark pass. Idempotent — safe to call once at app boot. */
export function initBrandWordmark(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const run = () => {
    schedule();
    // React re-renders replace text nodes; re-apply on DOM mutations (debounced).
    const observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        if (mut.addedNodes.length) {
          schedule();
          break;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}
