import type { Bot } from "grammy";
import { MESSAGES } from "../i18n/messages";
import type { UserService } from "../services/user-service";
import { requireLanguage } from "./require-language";

export function registerHelpCommand(bot: Bot, userService: UserService): void {
  bot.chatType("private").command("help", async (ctx) => {
    const lang = await requireLanguage(ctx, userService);
    if (!lang) return;
    await ctx.reply(MESSAGES[lang].help);
  });
}