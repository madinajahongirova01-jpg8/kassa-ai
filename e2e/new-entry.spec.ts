import { expect, test } from "@playwright/test";
import { formatMoney } from "../src/lib/format";
import { register, tg } from "./helpers";

test("a typed sale and expense are confirmed and show up on today's page", async ({ page }) => {
  await page.route("**/api/entries/parse", (route) => route.fulfill({ status: 503, json: { message: "API is unavailable" } }));
  await register(page);

  await page.goto("/app/new");
  const receipt = page.getByText(tg("sabt.receipt.title"), { exact: true }).locator("..");
  await expect(async () => {
    await page.locator("#sabt-text").fill("Фурӯш 500, такси 30");
    await expect(receipt.getByRole("listitem")).toHaveCount(2, { timeout: 2_000 });
  }).toPass();
  const confirm = page.getByRole("button", { name: tg("sabt.actions.confirm"), exact: true });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByText(tg("sabt.status.saved"), { exact: true })).toBeVisible();

  await page.goto("/app");
  const today = page.getByRole("heading", { name: tg("today.entries.title"), exact: true }).locator("..");
  const row = (title: string, amount: string) => today.locator("div").filter({ has: page.getByText(title, { exact: true }) }).filter({ hasText: amount });
  await expect(row("Фурӯш", formatMoney(50000, { sign: true, unit: false, locale: "tg" }))).toHaveCount(1);
  await expect(row("Такси", formatMoney(-3000, { unit: false, locale: "tg" }))).toHaveCount(1);
  await expect(today.locator("div").filter({ has: page.getByText("Фурӯш", { exact: true }) })).toHaveCount(1);
});
