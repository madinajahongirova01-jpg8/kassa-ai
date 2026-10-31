import { expect, test, type Page } from "@playwright/test";
import { register, ru, tg } from "./helpers";

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test("switching to Russian changes the texts and phone screens never scroll sideways", async ({ page }) => {
  await register(page);

  await page.getByRole("combobox", { name: tg("lang.label"), exact: true }).filter({ visible: true }).first().selectOption("ru");
  await expect(page.getByRole("heading", { name: ru("today.start.title"), exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: tg("today.start.title"), exact: true })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/app", "/app/new", "/app/debts", "/app/reports", "/app/settings"]) {
    await page.goto(path);
    await expect(page.locator("main").first()).toBeVisible();
    expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
  }
  await expect(page.getByRole("combobox", { name: ru("lang.label"), exact: true }).filter({ visible: true }).first()).toHaveValue("ru");
});
