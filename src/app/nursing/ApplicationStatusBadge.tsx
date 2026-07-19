import { WINDOW_STATUS_STYLES, type ActiveWindow } from './window-logic';

interface ApplicationStatusBadgeProps {
  activeWindow: ActiveWindow | null;
}

export default function ApplicationStatusBadge({ activeWindow }: ApplicationStatusBadgeProps) {
  if (!activeWindow) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
        No application window on file — verify directly
      </span>
    );
  }

  const style = WINDOW_STATUS_STYLES[activeWindow.status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style.className}`}
      data-testid="application-status-badge"
      data-status={activeWindow.status}
    >
      {activeWindow.status === 'closing-soon' ? (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
      ) : null}
      {style.label} · {activeWindow.window.term}
    </span>
  );
}
