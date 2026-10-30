import type { MessageKey } from "@/lib/i18n/translate";

// A placeholder profile until the admin panel has real accounts; the texts are in the dictionaries.
export const adminUser: { nameKey: MessageKey; roleKey: MessageKey } = {
  nameKey: "admin.user",
  roleKey: "admin.panel",
};

export const systemStatus = {
  uptime: "—",
  cpu: "—",
  version: "—",
  region: "—",
};
