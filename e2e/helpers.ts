import { expect, type Locator, type Page } from "@playwright/test";
import { formatMoney } from "../src/lib/format";
import type { Locale } from "../src/lib/i18n/config";
import { createT } from "../src/lib/i18n/translate";

export const tg = createT("tg");
export const ru = createT("ru");

export const PASSWORD = "browser-test-password";

export function money(somoni: number, locale: Locale = "tg") {
  return formatMoney(somoni * 100, { unit: false, locale });
}

export function uniqueEmail() {
  return `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function openWith(button: Locator, opened: Locator) {
  await expect(async () => {
    await button.click();
    await expect(opened).toBeVisible({ timeout: 2_000 });
  }).toPass();
}

export async function register(page: Page, businessName = "Дӯкони санҷишӣ") {
  const email = uniqueEmail();
  await page.goto("/login");
  const businessField = page.getByLabel(tg("auth.fields.businessName"), { exact: true });
  await openWith(page.getByRole("button", { name: tg("auth.modes.register"), exact: true }), businessField);
  await businessField.fill(businessName);
  await page.getByLabel(tg("auth.fields.email"), { exact: true }).fill(email);
  await page.getByLabel(tg("auth.fields.password"), { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: tg("auth.register.submit"), exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  return email;
}
