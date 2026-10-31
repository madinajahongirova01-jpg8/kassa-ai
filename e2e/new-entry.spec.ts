import { expect, test } from "@playwright/test";
import { formatMoney } from "../src/lib/format";
import { register, tg } from "./helpers";

test("a typed sale and expense are confirmed and show up on today's page", async ({ page }) => {
  await register(page);

  await page.goto("/app/new");
  await page.locator("#sabt-text").fill("Фурӯш 500, такси 30");
  const confirm = page.getByRole("button", { name: tg("sabt.actions.confirm"), exact: true });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByText(tg("sabt.status.saved"), { exact: true })).toBeVisible();

  await page.goto("/app");
  const today = page.getByRole("heading", { name: tg("today.entries.title"), exact: true }).locator("..");
  const row = (title: string) => today.locator("div").filter({ has: page.getByText(title, { exact: true }) });
  await expect(row("Фурӯш")).toContainText(formatMoney(50000, { sign: true, unit: false, locale: "tg" }));
  await expect(row("Такси")).toContainText(formatMoney(-3000, { unit: false, locale: "tg" }));
});
