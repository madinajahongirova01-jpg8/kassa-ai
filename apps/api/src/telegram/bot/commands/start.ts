import type { Bot } from "grammy";
import { CHOOSE_LANGUAGE, MESSAGES, NEED_START } from "../i18n/messages";
import { languageKeyboard } from "../keyboards/language";
import type { UserService } from "../services/user-service";
import type { Lang } from "../types/language";

export function registerStartCommand(bot: Bot, userService: UserService): void {
  bot.chatType("private").command("start", async (ctx) => {
    if (!ctx.from) return;

    const { user, isNew } = await userService.registerUser({
      telegramUserId: ctx.from.id,
      telegramChatId: ctx.chat.id,
      firstName: ctx.from.first_name ?? null,
    });

    if (!user.language) {
      await ctx.reply(CHOOSE_LANGUAGE, { reply_markup: languageKeyboard() });
      return;
    }

    const m = MESSAGES[user.language];
    const name = user.firstName ?? m.friend;
    const greeting = isNew ? m.welcomeNew(name) : m.welcomeBack(name);
    await ctx.reply(`${greeting}\n\n${m.help}`);
  });

  bot.chatType("private").command("language", async (ctx) => {
    await ctx.reply(CHOOSE_LANGUAGE, { reply_markup: languageKeyboard() });
  });

  bot.callbackQuery(/^lang:(tg|ru|en)$/, async (ctx) => {
    const lang = ctx.match[1] as Lang;
    const previous = await userService.getLanguage(ctx.from.id);
    const user = await userService.setLanguage(ctx.from.id, lang);
    await ctx.answerCallbackQuery();

    if (!user) {
      await ctx.reply(NEED_START);
      return;
    }

    await ctx.editMessageReplyMarkup().catch(() => undefined);
    const m = MESSAGES[lang];
    const name = user.firstName ?? m.friend;
    if (previous === null) {
      await ctx.reply(`${m.welcomeNew(name)}\n\n${m.help}`);
    } else {
      await ctx.reply(m.languageSet);
    }
  });
}