import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./brand-fonts.css";
import { initBrandLogo } from "./brand";
import { initBrandWordmark } from "./brand-wordmark";

// Apply any Super-Admin-configured logo as early as possible.
initBrandLogo();

// Render every LIMEX / TBM brand word in the Cinzel wordmark font everywhere,
// including copy stored as plain strings in *.ts data files. Runs after mount
// and re-applies on DOM changes; skips inputs, code blocks, and already-styled words.
initBrandWordmark();

// Retire any previously-registered service worker (from the prior site) so it
// cannot serve stale cached content over the new experience.
if ("serviceWorker" in navigator) {
  const clearStaleAppShell = async () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    const refreshKey = "wd_sw_retired_refresh_v2";
    if (hadController && window.sessionStorage.getItem(refreshKey) !== "1") {
      window.sessionStorage.setItem(refreshKey, "1");
      window.location.reload();
    }
  };

  clearStaleAppShell().catch(() => {});
}

// Google Analytics (GA4)
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (gaId) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", gaId);
}

const hostname = window.location.hostname.toLowerCase();
const adminHosts = new Set(["admin.whitedotindia.in", "admin.whitedot-limex.in"]);
const isAdminHost = adminHosts.has(hostname);
const PREVIEW_QUERY_KEY = "wd_preview";
const PREVIEW_STORAGE_KEY = "wd_public_preview";
const PUBLIC_LOADING_SETTING_KEY = "public_loading_enabled";
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://api.whitedotindia.in");

if (isAdminHost && !window.location.hash.startsWith("#/admin")) {
  window.location.hash = "#/admin/login";
}

function checkAdminQueryParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    const val = params.get("wd_show_admin");
    if (val === "1") {
      window.localStorage.setItem("wd_show_admin_button", "true");
      params.delete("wd_show_admin");
      const cleanSearch = params.toString();
      const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", cleanUrl);
    } else if (val === "0") {
      window.localStorage.removeItem("wd_show_admin_button");
      params.delete("wd_show_admin");
      const cleanSearch = params.toString();
      const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", cleanUrl);
    }
  } catch {
    // Ignore storage/history errors in isolated environments.
  }
}
checkAdminQueryParam();

const isLocal = ["localhost", "127.0.0.1", "::1"].includes(hostname);
const isKnownPublicAdminHost =
  hostname === "whitedotindia.in" ||
  hostname === "www.whitedotindia.in" ||
  (hostname === "rajbhanderi107-droid.github.io" && window.location.pathname.startsWith("/whitedot-limex.in/"));
const isAdmin = isAdminHost || ((isLocal || isKnownPublicAdminHost) && window.location.hash.startsWith("#/admin"));

function hasPublicPreviewAccess(): boolean {
  const params = new URLSearchParams(window.location.search);
  const previewValue = params.get(PREVIEW_QUERY_KEY);

  try {
    if (previewValue === "1") {
      return true;
    }

    if (previewValue === "0") {
      window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
      params.delete(PREVIEW_QUERY_KEY);
      const cleanSearch = params.toString();
      const cleanUrl = `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", cleanUrl);
      return false;
    }

    window.localStorage.removeItem(PREVIEW_STORAGE_KEY);
    return false;
  } catch {
    return previewValue === "1";
  }
}

async function shouldShowPublicLoading(): Promise<boolean> {
  if (hasPublicPreviewAccess()) return false;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 900);

  try {
    const res = await fetch(`${API_BASE}/api/public/settings`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    // Fail open to the real site: only show the Coming Soon page when the
    // backend explicitly says public_loading_enabled === "true".
    if (!res.ok) return false;

    const json = await res.json();
    const settings = Array.isArray(json.data) ? json.data : [];
    const loadingSetting = settings.find((setting: { key?: string }) => setting.key === PUBLIC_LOADING_SETTING_KEY);
    return loadingSetting?.value === "true";
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

function showPublicLoadingPage() {
  document.documentElement.style.background = "#181b19";
  document.body.style.margin = "0";
  document.body.style.background = "#181b19";
  document.body.setAttribute("aria-busy", "true");
  const loader = document.getElementById("agg-wd-loader");
  if (loader) loader.setAttribute("data-maintenance", "");
}

// Coming Soon / loading page — now controlled by the `public_loading_enabled`
// setting from the portal Settings page instead of being hardcoded on.
function renderComingSoon() {
  import("./ComingSoon").then(({ default: ComingSoon }) => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <ComingSoon />
      </StrictMode>,
    );
    // ComingSoon doesn't run the aggregation loader, so dismiss the static
    // splash itself — otherwise it would cover the page.
    const loader = document.getElementById("agg-wd-loader");
    if (loader && !loader.hasAttribute("data-maintenance")) {
      loader.setAttribute("data-done", "");
      window.setTimeout(() => loader.remove(), 450);
    }
  });
}

function renderPublicSite() {
  Promise.all([
    import("./cinematic-v2/CinematicAppV2"),
    import("./premium-wd"),
  ]).then(([{ default: CinematicAppV2 }, { PremiumProvider }]) => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <PremiumProvider>
          <CinematicAppV2 />
        </PremiumProvider>
      </StrictMode>,
    );
  });
}

if (isAdmin) {
  document.documentElement.style.background = "#0f1210";
  document.body.style.margin = "0";
  document.body.style.background = "#0f1210";
  const loader = document.getElementById("agg-wd-loader");
  if (loader) loader.remove();
}

if (isAdmin) {
  const AdminApp = lazy(() => import("./admin/AdminApp"));

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <HashRouter>
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#0f1210",
                color: "#8c9488",
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                fontSize: ".85rem",
              }}
            >
              Loading admin...
            </div>
          }
        >
          <AdminApp />
        </Suspense>
      </HashRouter>
    </StrictMode>,
  );
} else {
  // The portal toggle (`public_loading_enabled`) decides what visitors see:
  // ON  → animated Coming Soon page; OFF → the full cinematic site.
  shouldShowPublicLoading().then((showLoading) => {
    if (showLoading) {
      showPublicLoadingPage();
      renderComingSoon();
    } else {
      renderPublicSite();
    }
  });
}
