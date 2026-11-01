import type { Context } from "grammy";
import { CHOOSE_LANGUAGE } from "../i18n/messages";
import { languageKeyboard } from "../keyboards/language";
import type { UserService } from "../services/user-service";
import type { Lang } from "../types/language";

export async function requireLanguage(
  ctx: Context,
  userService: UserService,
): Promise<Lang | null> {
  if (!ctx.from) return null;
  const lang = await userService.getLanguage(ctx.from.id);
  if (lang) return lang;
  await ctx.reply(CHOOSE_LANGUAGE, { reply_markup: languageKeyboard() });
  return null;
}