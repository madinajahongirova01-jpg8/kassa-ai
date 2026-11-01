import type { Bot } from "grammy";
import { MESSAGES, NEED_START } from "../i18n/messages";
import type { UserService } from "../services/user-service";
import { requireLanguage } from "./require-language";

export function registerStopCommand(bot: Bot, userService: UserService): void {
  bot.chatType("private").command("stop", async (ctx) => {
    const lang = await requireLanguage(ctx, userService);
    if (!lang) return;

    const user = await userService.stopUser(ctx.from!.id);
    await ctx.reply(user ? MESSAGES[lang].stopped : NEED_START);
  });
}