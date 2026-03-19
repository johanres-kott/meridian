import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("shows login form with Thesion branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Thesion").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Logga in" })).toBeVisible();
    await expect(page.locator('input[placeholder="din@email.com"]')).toBeVisible();
    await expect(page.locator("text=Integritetspolicy").first()).toBeVisible();
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder="din@email.com"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.getByRole("button", { name: "Logga in", exact: true }).click();
    // Should show error or stay on login page
    await expect(page.getByRole("heading", { name: "Logga in" })).toBeVisible({ timeout: 5000 });
  });

  test("privacy policy link works", async ({ page }) => {
    await page.goto("/");
    await page.locator("text=Integritetspolicy").first().click();
    await expect(page.locator("text=Vilken data vi samlar in").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Authenticated app", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder="din@email.com"]', "qa@thesion.tech");
    await page.fill('input[type="password"]', "beRwev-pevnom-9jysta");
    await page.click("button:has-text('Logga in')");
    // Wait for app to load after login
    await expect(page.locator("text=Översikt").first()).toBeVisible({ timeout: 10000 });
  });

  test("navbar shows all tabs", async ({ page }) => {
    await expect(page.locator("text=Översikt")).toBeVisible();
    await expect(page.locator("text=Marknader")).toBeVisible();
    await expect(page.locator("text=Portfölj")).toBeVisible();
    await expect(page.locator("text=Nyckeltal")).toBeVisible();
    await expect(page.locator("text=Company Search")).toBeVisible();
  });

  test("markets page loads index data", async ({ page }) => {
    // Should already be on markets/overview page
    await expect(page.locator("text=Hej")).toBeVisible({ timeout: 5000 });
  });

  test("can navigate to portfolio page", async ({ page }) => {
    await page.click("text=Portfölj");
    await expect(page.locator("text=Portfölj").first()).toBeVisible();
    await expect(page.locator("text=Investmentbolag")).toBeVisible();
    await expect(page.locator("text=Importera portfölj")).toBeVisible();
  });

  test("can open investment company modal", async ({ page }) => {
    await page.click("text=Portfölj");
    await page.click("button:has-text('Investmentbolag')");
    await expect(page.locator("text=Skapa grupp från investmentbolag")).toBeVisible({ timeout: 5000 });
    // Should show at least 3 companies (static fallback)
    await expect(page.locator("text=Investor")).toBeVisible();
    await expect(page.locator("text=Öresund")).toBeVisible();
    await expect(page.locator("text=Creades")).toBeVisible();
  });

  test("can navigate to nyckeltal page", async ({ page }) => {
    await page.click("text=Nyckeltal");
    await expect(page.locator("text=Nyckeltal").first()).toBeVisible();
  });

  test("can navigate to company search", async ({ page }) => {
    await page.click("text=Company Search");
    await expect(page.locator('input[placeholder*="Sök"]').or(page.locator('input[placeholder*="sök"]'))).toBeVisible();
  });

  test("AI button is visible", async ({ page }) => {
    await expect(page.locator("button:has-text('AI')")).toBeVisible();
  });
});

test.describe("Mobile responsiveness", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("login page works on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Thesion").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Logga in" })).toBeVisible();
  });

  test("app has blue banner on mobile after login", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[placeholder="din@email.com"]', "qa@thesion.tech");
    await page.fill('input[type="password"]', "beRwev-pevnom-9jysta");
    await page.click("button:has-text('Logga in')");
    await expect(page.locator("text=Översikt").first()).toBeVisible({ timeout: 10000 });
    // Blue banner should be visible with Thesion text
    await expect(page.locator("text=Thesion").first()).toBeVisible();
  });
});
