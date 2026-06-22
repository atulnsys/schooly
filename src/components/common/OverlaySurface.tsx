import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { getFocusableElements, trapDialogKeyboard } from "../../lib/accessibility";

let bodyLockCount = 0;
let bodyLockPreviousOverflow: string | null = null;

function lockBodyScroll(): () => void {
  if (typeof document === "undefined") {
    return () => undefined;
  }

  if (bodyLockCount === 0) {
    bodyLockPreviousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  bodyLockCount += 1;

  return () => {
    if (bodyLockCount > 0) {
      bodyLockCount -= 1;
    }

    if (bodyLockCount === 0 && bodyLockPreviousOverflow !== null) {
      document.body.style.overflow = bodyLockPreviousOverflow;
      bodyLockPreviousOverflow = null;
    }
  };
}

interface OverlaySurfaceProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  role?: "dialog" | "alertdialog";
  maxWidthClassName?: string;
  panelClassName?: string;
  overlayClassName?: string;
  overlayId?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeLabel?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export default function OverlaySurface({
  open,
  onClose,
  title,
  description,
  header,
  body,
  footer,
  role = "dialog",
  maxWidthClassName = "max-w-4xl",
  panelClassName = "",
  overlayClassName = "",
  overlayId,
  bodyClassName = "px-5 py-4",
  footerClassName = "px-5 py-4",
  closeLabel = "Close dialog",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  returnFocusRef,
  initialFocusRef,
}: OverlaySurfaceProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseBodyScroll = lockBodyScroll();

    const timer = window.requestAnimationFrame(() => {
      const initialFocusTarget =
        initialFocusRef?.current ||
        getFocusableElements(panelRef.current)[0] ||
        panelRef.current;

      initialFocusTarget?.focus?.({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(timer);
      releaseBodyScroll();
      (returnFocusRef?.current ?? restoreFocusRef.current)?.focus?.({ preventScroll: true });
    };
  }, [initialFocusRef, open, returnFocusRef]);

  if (!open) return null;

  return (
    <div
      id={overlayId}
      className={`fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 ${overlayClassName}`}
      onClick={(event) => {
        if (!closeOnBackdropClick) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ${maxWidthClassName} ${panelClassName}`}
        onKeyDown={(event) => trapDialogKeyboard(event, onClose, { closeOnEscape })}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className={header ? "sr-only" : "text-lg font-black tracking-tight text-slate-950"}>
              {title}
            </h2>
            {description && !header && (
              <p id={descriptionId} className="max-w-3xl text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            )}
            {description && header && (
              <p id={descriptionId} className="sr-only">
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-500 hover:bg-slate-50"
              aria-label={closeLabel}
              title={closeLabel}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
          {header}
          {body}
        </div>

        {footer && (
          <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
