import { expect, test } from "@playwright/test";
import { register, tg } from "./helpers";

test("a new owner registers and sees the start card", async ({ page }) => {
  await register(page);

  await expect(page.getByRole("heading", { name: tg("today.start.title"), exact: true })).toBeVisible();
});
