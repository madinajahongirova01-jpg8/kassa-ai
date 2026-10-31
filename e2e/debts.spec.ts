import { expect, test } from "@playwright/test";
import { money, openWith, register, tg } from "./helpers";

test("a partial card payment lowers the customer's debt", async ({ page }) => {
  const customer = "Раҳим Каримов";
  await register(page);

  await page.goto("/app/debts");
  const nameField = page.getByLabel(tg("nasiya.forms.customerName"), { exact: true });
  await openWith(page.getByRole("button", { name: tg("nasiya.headline.newCustomer"), exact: true }).first(), nameField);
  await nameField.fill(customer);
  await page.getByRole("button", { name: tg("nasiya.forms.addCustomer"), exact: true }).click();
  await expect(page.getByText(tg("nasiya.notices.customerAdded"), { exact: true })).toBeVisible();

  await openWith(page.getByRole("button", { name: tg("nasiya.headline.newDebt"), exact: true }), page.locator("#debt-customer"));
  await page.locator("#debt-customer").selectOption({ label: customer });
  await page.locator("#debt-amount").fill("500");
  await page.getByRole("button", { name: tg("nasiya.forms.recordDebt"), exact: true }).click();
  await expect(page.getByText(tg("nasiya.notices.debtAdded"), { exact: true })).toBeVisible();

  const sheet = page.getByRole("region", { name: tg("nasiya.sheet.label", { name: customer }), exact: true });
  await expect(sheet.getByText(money(500), { exact: true }).first()).toBeVisible();

  await sheet.getByRole("button", { name: tg("nasiya.payment.title"), exact: true }).click();
  const payment = sheet.getByRole("form", { name: tg("nasiya.payment.title"), exact: true });
  await payment.getByLabel(tg("nasiya.payment.amount")).fill("200");
  await payment.getByText(tg("nasiya.methods.CARD"), { exact: true }).click();
  await payment.getByRole("button", { name: tg("nasiya.payment.confirm"), exact: true }).click();

  await expect(sheet.getByText(tg("nasiya.payment.saved"), { exact: true })).toBeVisible();
  await expect(sheet.getByText(money(300), { exact: true }).first()).toBeVisible();
  await expect(sheet.getByText(money(500), { exact: true })).toHaveCount(1);
  await expect(sheet.getByText(` · ${tg("nasiya.methods.CARD")}`)).toBeVisible();
});
