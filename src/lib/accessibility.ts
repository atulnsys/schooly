import type { KeyboardEvent } from "react";

export const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) =>
    !element.hasAttribute("disabled") && element.tabIndex !== -1,
  );
}

export function focusFirstFocusable(root: HTMLElement | null): void {
  getFocusableElements(root)[0]?.focus({ preventScroll: true });
}

export function trapDialogKeyboard(
  event: KeyboardEvent<HTMLElement>,
  onClose: () => void,
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
    return;
  }

  if (event.key !== "Tab") return;

  const focusables = getFocusableElements(event.currentTarget as HTMLElement);
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
  const nextIndex = event.shiftKey
    ? (currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1)
    : (currentIndex === -1 || currentIndex === focusables.length - 1 ? 0 : currentIndex + 1);

  event.preventDefault();
  focusables[nextIndex]?.focus();
}
