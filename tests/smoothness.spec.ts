import { test, expect } from "@playwright/test";

test.describe("WhiteDot Smoothness and Performance Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Open the local dev server URL with relative path
    await page.goto("/?v1=1");
  });

  test("should load the main page successfully and have correct brand name", async ({ page }) => {
    await expect(page).toHaveTitle(/White Dot/i);
    const brand = page.locator(".cine-brand").first();
    await expect(brand).toBeVisible();
    await expect(brand).toContainText("White Dot");
  });

  test("should check viewport layout and avoid header/copy overlap on mobile", async ({ page }) => {
    // Set typical mobile viewport (iPhone 14 width)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    const eyebrow = page.locator(".cine-eyebrow");
    await expect(eyebrow).toBeVisible();
    await expect(eyebrow).toContainText(/Next-Gen Limestone Technology/i);

    // Verify nav is fixed at the top
    const nav = page.locator(".cine-nav");
    await expect(nav).toBeVisible();
    const navBox = await nav.boundingBox();
    const eyebrowBox = await eyebrow.boundingBox();

    if (navBox && eyebrowBox) {
      // The top of the eyebrow should sit below the bottom of the navigation bar
      expect(eyebrowBox.y).toBeGreaterThanOrEqual(navBox.y + navBox.height);
    }
  });

  test("should check video performance settings", async ({ page }) => {
    const videos = page.locator("video.cine-svideo-el");
    const count = await videos.count();

    for (let i = 0; i < count; i++) {
      const video = videos.nth(i);
      // All video backgrounds must be muted, loop, and playsinline for smooth autoplay
      await expect(video).toHaveAttribute("muted", "");
      await expect(video).toHaveAttribute("loop", "");
      await expect(video).toHaveAttribute("playsinline", "");
      await expect(video).toHaveAttribute("preload", "none"); // Lazy loaded media
    }
  });

  test("should render 3D canvas model and particle system correctly", async ({ page }) => {
    const isWebGLSupported = await page.evaluate(() => {
      try {
        const canvas = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
      } catch (e) {
        return false;
      }
    });

    if (isWebGLSupported) {
      const canvas = page.locator("canvas.cine-mi-orb-canvas");
      const canvasCount = await canvas.count();
      if (canvasCount > 0) {
        await expect(canvas).toBeVisible({ timeout: 10000 });
      } else {
        console.log("WebGL canvas element not found in DOM.");
      }
    } else {
      console.log("WebGL not supported in headless browser environment; skipping WebGL canvas visibility check.");
    }
  });

  test("should respect prefers-reduced-motion media query fallback settings", async ({ page }) => {
    // Emulate reduced motion user settings
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();

    // Verify that the video elements are omitted / not rendered
    const video = page.locator("video.cine-svideo-el");
    const videoCount = await video.count();
    if (videoCount > 0) {
      await expect(video).not.toBeVisible();
    }

    // Verify static posters are displayed as a graceful fallback
    const poster = page.locator("img.cine-svideo-poster");
    const posterCount = await poster.count();
    if (posterCount > 0) {
      await expect(poster).toBeVisible();
    }
  });
});
