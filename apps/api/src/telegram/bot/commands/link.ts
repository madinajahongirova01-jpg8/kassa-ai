import type { Bot } from "grammy";
import { NEED_START } from "../i18n/messages";
import { MESSAGES_EXTRA } from "../i18n/messages-extra";
import type { LinkService } from "../services/link-service";
import type { UserService } from "../services/user-service";
import { requireLanguage } from "./require-language";

export function registerLinkCommand(
  bot: Bot,
  linkService: LinkService,
  userService: UserService,
): void {
  bot.chatType("private").command("link", async (ctx) => {
    const lang = await requireLanguage(ctx, userService);
    if (!lang) return;

    const result = await linkService.createCode(ctx.from!.id);
    if (!result) {
      await ctx.reply(NEED_START);
      return;
    }
    await ctx.reply(MESSAGES_EXTRA[lang].linkCode(result.code, result.minutes));
  });
}