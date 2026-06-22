import React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type FeedbackTone = "info" | "success" | "warning" | "error";

interface FeedbackBannerProps {
  tone: FeedbackTone;
  message: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: React.ReactNode;
  onAction?: () => void;
  dismissLabel?: string;
  onDismiss?: () => void;
  className?: string;
}

const toneClasses: Record<FeedbackTone, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-rose-50 border-rose-200 text-rose-900",
};

function toneIcon(tone: FeedbackTone) {
  if (tone === "success") return <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" focusable="false" />;
  if (tone === "warning") return <TriangleAlert size={16} className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true" focusable="false" />;
  if (tone === "error") return <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" aria-hidden="true" focusable="false" />;
  return <Info size={16} className="text-blue-500 shrink-0 mt-0.5" aria-hidden="true" focusable="false" />;
}

export default function FeedbackBanner({
  tone,
  message,
  title,
  description,
  actionLabel,
  onAction,
  dismissLabel = "Dismiss notification",
  onDismiss,
  className = "",
}: FeedbackBannerProps) {
  const role = tone === "error" || tone === "warning" ? "alert" : "status";
  const ariaLive = tone === "error" || tone === "warning" ? "assertive" : "polite";

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs ${toneClasses[tone]} ${className}`}
      role={role}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="flex items-start gap-2.5">
        {toneIcon(tone)}
        <div className="space-y-1 min-w-0 flex-1">
          {title && <div className="font-bold">{title}</div>}
          {description && <div className="text-[10.5px] font-medium leading-relaxed opacity-90 break-words">{description}</div>}
          <div className="font-medium leading-relaxed break-words">{message}</div>
          {(actionLabel || onDismiss) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {actionLabel && onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className="inline-flex items-center rounded-lg border border-current/15 bg-white/70 px-2.5 py-1.5 text-[10px] font-bold transition-colors hover:bg-white"
                >
                  {actionLabel}
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors hover:bg-black/5"
                  aria-label={dismissLabel}
                >
                  <X size={12} aria-hidden="true" focusable="false" />
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
