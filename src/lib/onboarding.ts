export type OnboardingProgress = { hasEntry: boolean; hasCustomer: boolean };
export type OnboardingStepId = "entry" | "debt" | "reports";
export type OnboardingStep = { id: OnboardingStepId; href: string; done: boolean };
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

export const ONBOARDING_DISMISSED_KEY = "kassa.onboarding.dismissed";

export function onboardingSteps({ hasEntry, hasCustomer }: OnboardingProgress): OnboardingStep[] {
  return [
    { id: "entry", href: "/app/new", done: hasEntry },
    { id: "debt", href: "/app/debts", done: hasCustomer },
    { id: "reports", href: "/app/reports", done: false },
  ];
}

export function showOnboarding({ hasEntry, hasCustomer }: OnboardingProgress, dismissed: boolean): boolean {
  return !dismissed && !(hasEntry && hasCustomer);
}

export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readDismissed(storage: KeyValueStorage | null): boolean {
  try {
    return storage?.getItem(ONBOARDING_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDismissed(storage: KeyValueStorage | null): boolean {
  try {
    if (!storage) return false;
    storage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
