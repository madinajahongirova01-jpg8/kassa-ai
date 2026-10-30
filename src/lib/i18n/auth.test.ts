import { describe, expect, it } from "vitest";
import { authErrorKey } from "@/lib/authText";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { createT } from "@/lib/i18n/translate";

const CYRILLIC = /[Ѐ-ӿ]/;
const TAJIK_LETTERS = /[ӣӯҳқғҷӢӮҲҚҒҶ]/;

function leaves(node: object): string[] {
  return Object.values(node).flatMap((value) => (typeof value === "string" ? [value] : leaves(value as object)));
}

describe("Login and Register texts", () => {
  it("are filled in and really translated", () => {
    for (const locale of LOCALES) for (const text of leaves(dictionaries[locale].auth)) expect(text.trim()).not.toBe("");
    for (const text of leaves(dictionaries.en.auth)) expect(text).not.toMatch(CYRILLIC);
    for (const text of leaves(dictionaries.ru.auth)) expect(text).not.toMatch(TAJIK_LETTERS);
  });

  it("keep the original Tajik texts", () => {
    const t = createT("tg");
    expect(t("auth.login.submit")).toBe("Даромадан →");
    expect(t("auth.register.title")).toBe("Ҳисоб кушоед");
    expect(t("auth.fields.passwordHint")).toBe("камаш 8 аломат");
  });

  it("translate both modes", () => {
    expect(["login", "register"].map((mode) => createT("ru")(`auth.modes.${mode}` as never))).toEqual(["Вход", "Регистрация"]);
    expect(["login", "register"].map((mode) => createT("en")(`auth.${mode}.submit` as never))).toEqual(["Sign in →", "Sign up →"]);
  });
});

describe("authErrorKey", () => {
  it("picks the message by status and mode", () => {
    expect(authErrorKey(401, "login")).toBe("auth.errors.wrongCredentials");
    expect(authErrorKey(401, "register")).toBe("auth.errors.server");
    expect(authErrorKey(409, "register")).toBe("auth.errors.emailTaken");
    expect(authErrorKey(400, "register")).toBe("auth.errors.registerInvalid");
    expect(authErrorKey(400, "login")).toBe("auth.errors.loginInvalid");
    expect(authErrorKey(429, "login")).toBe("auth.errors.tooMany");
    expect(authErrorKey(403, "login")).toBe("auth.errors.forbidden");
    expect(authErrorKey(0, "login")).toBe("auth.errors.server");
  });

  it("shows the original Tajik messages and translations", () => {
    expect(createT("tg")(authErrorKey(401, "login"))).toBe("Почта ё парол нодуруст аст.");
    expect(createT("ru")(authErrorKey(409, "register"))).toBe("Эта почта уже зарегистрирована. Лучше войдите.");
    expect(createT("en")(authErrorKey(500, "login"))).toBe("The server isn't responding. Try again a little later.");
  });
});
